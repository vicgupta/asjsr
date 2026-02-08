"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notifications";
import type { DecisionType } from "@/types/database";

export async function issueDecision(data: {
  submissionId: string;
  decision: DecisionType;
  notes: string;
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

  const { error: decisionError } = await supabase.from("decisions").insert({
    submission_id: data.submissionId,
    editor_id: user.id,
    decision: data.decision,
    notes: data.notes,
  });

  if (decisionError) return { error: decisionError.message };

  // Update submission status based on decision
  const statusMap: Record<DecisionType, string> = {
    accept: "accepted",
    reject: "rejected",
    revise: "revision_requested",
  };

  // Get submission info for notification
  const { data: sub } = await supabase
    .from("submissions")
    .select("title, submitting_author_id")
    .eq("id", data.submissionId)
    .single();

  await supabase
    .from("submissions")
    .update({ status: statusMap[data.decision] as any })
    .eq("id", data.submissionId);

  // Notify author
  if (sub) {
    notify({
      userId: sub.submitting_author_id,
      type: "decision_made",
      title: "Decision on Your Submission",
      message: `Your manuscript "${sub.title}" has been ${data.decision}ed.`,
      link: `/dashboard/submissions/${data.submissionId}`,
      emailData: {
        title: sub.title,
        decision: data.decision,
        notes: data.notes,
      },
    });
  }

  revalidatePath(`/dashboard/editor/submissions/${data.submissionId}`);
  revalidatePath("/dashboard/editor");
  revalidatePath(`/dashboard/submissions/${data.submissionId}`);
  return { success: true };
}
