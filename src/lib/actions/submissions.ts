"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notifications";
import type { CoAuthor } from "@/types/database";

export async function createSubmission(formData: {
  title: string;
  abstract: string;
  keywords: string[];
  co_authors: CoAuthor[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      title: formData.title,
      abstract: formData.abstract,
      keywords: formData.keywords,
      co_authors: formData.co_authors as any,
      submitting_author_id: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Notify author
  notify({
    userId: user.id,
    type: "submission_received",
    title: "Submission Received",
    message: `Your manuscript "${formData.title}" has been submitted.`,
    link: `/dashboard/submissions/${data.id}`,
    emailData: { title: formData.title },
  });

  revalidatePath("/dashboard/submissions");
  return { id: data.id };
}

export async function updateSubmissionFile(
  submissionId: string,
  filePath: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("submissions")
    .update({ file_path: filePath })
    .eq("id", submissionId)
    .eq("submitting_author_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/submissions");
  return { success: true };
}

export async function withdrawSubmission(submissionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: submission } = await supabase
    .from("submissions")
    .select("status, submitting_author_id")
    .eq("id", submissionId)
    .single();

  if (!submission) return { error: "Submission not found" };
  if (submission.submitting_author_id !== user.id)
    return { error: "Not authorized" };
  if (submission.status === "published" || submission.status === "withdrawn")
    return { error: "Cannot withdraw this submission" };

  const { data: sub } = await supabase
    .from("submissions")
    .select("title")
    .eq("id", submissionId)
    .single();

  const { error } = await supabase
    .from("submissions")
    .update({ status: "withdrawn" })
    .eq("id", submissionId);

  if (error) return { error: error.message };

  // Notify editors about withdrawal
  const { data: editors } = await supabase
    .from("profiles")
    .select("id")
    .contains("roles", ["editor"]);

  if (editors) {
    for (const editor of editors) {
      notify({
        userId: editor.id,
        type: "submission_withdrawn",
        title: "Submission Withdrawn",
        message: `"${sub?.title || "A submission"}" has been withdrawn.`,
        link: `/dashboard/editor/submissions/${submissionId}`,
        emailData: { title: sub?.title },
      });
    }
  }

  revalidatePath("/dashboard/submissions");
  revalidatePath(`/dashboard/submissions/${submissionId}`);
  return { success: true };
}
