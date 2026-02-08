"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notifications";

export async function assignReviewer(data: {
  submissionId: string;
  reviewerId: string;
  deadline: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify editor role
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single();

  if (!profile?.roles?.includes("editor")) {
    return { error: "Not authorized" };
  }

  // COI check - cannot assign submitting author as reviewer
  const { data: submission } = await supabase
    .from("submissions")
    .select("submitting_author_id")
    .eq("id", data.submissionId)
    .single();

  if (!submission) return { error: "Submission not found" };
  if (submission.submitting_author_id === data.reviewerId) {
    return { error: "Cannot assign the submitting author as reviewer" };
  }

  const { error } = await supabase.from("reviews").insert({
    submission_id: data.submissionId,
    reviewer_id: data.reviewerId,
    deadline: data.deadline,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "This reviewer is already assigned" };
    }
    return { error: error.message };
  }

  // Auto-transition to under_review
  await supabase
    .from("submissions")
    .update({ status: "under_review" })
    .eq("id", data.submissionId)
    .in("status", ["submitted"]);

  // Get submission title for notification
  const { data: sub } = await supabase
    .from("submissions")
    .select("title")
    .eq("id", data.submissionId)
    .single();

  // Notify reviewer
  notify({
    userId: data.reviewerId,
    type: "reviewer_assigned",
    title: "New Review Assignment",
    message: `You have been assigned to review "${sub?.title || "a manuscript"}".`,
    link: "/dashboard/reviews",
    emailData: { title: sub?.title, deadline: data.deadline },
  });

  revalidatePath(`/dashboard/editor/submissions/${data.submissionId}`);
  revalidatePath("/dashboard/editor");
  return { success: true };
}

export async function submitReview(data: {
  reviewId: string;
  content: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: review } = await supabase
    .from("reviews")
    .select("reviewer_id, submission_id")
    .eq("id", data.reviewId)
    .single();

  if (!review) return { error: "Review not found" };
  if (review.reviewer_id !== user.id) return { error: "Not authorized" };

  const { error } = await supabase
    .from("reviews")
    .update({
      content: data.content,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", data.reviewId);

  if (error) return { error: error.message };

  // Notify editors about submitted review
  const { data: sub } = await supabase
    .from("submissions")
    .select("title")
    .eq("id", review.submission_id)
    .single();

  const { data: reviewer } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: editors } = await supabase
    .from("profiles")
    .select("id")
    .contains("roles", ["editor"]);

  if (editors) {
    for (const editor of editors) {
      notify({
        userId: editor.id,
        type: "review_submitted",
        title: "Review Submitted",
        message: `A review has been submitted for "${sub?.title || "a manuscript"}".`,
        link: `/dashboard/editor/submissions/${review.submission_id}`,
        emailData: {
          title: sub?.title,
          reviewerName: reviewer?.full_name || "A reviewer",
        },
      });
    }
  }

  revalidatePath("/dashboard/reviews");
  revalidatePath(`/dashboard/reviews/${data.reviewId}`);
  revalidatePath(`/dashboard/editor/submissions/${review.submission_id}`);
  return { success: true };
}
