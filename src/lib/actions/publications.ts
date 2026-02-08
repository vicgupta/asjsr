"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notifications";

export async function publishPaper(submissionId: string) {
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

  // Verify submission is accepted
  const { data: submission } = await supabase
    .from("submissions")
    .select("status")
    .eq("id", submissionId)
    .single();

  if (!submission) return { error: "Submission not found" };
  if (submission.status !== "accepted")
    return { error: "Only accepted submissions can be published" };

  // Get DOI settings
  const { data: settings } = await supabase
    .from("journal_settings")
    .select("doi_prefix")
    .single();

  const year = new Date().getFullYear();

  // Count existing publications this year for sequence number
  const { count } = await supabase
    .from("publications")
    .select("*", { count: "exact", head: true })
    .gte("published_at", `${year}-01-01`)
    .lt("published_at", `${year + 1}-01-01`);

  const seq = (count || 0) + 1;
  const doi = `${settings?.doi_prefix || "10.XXXXX"}/asjsr.${year}.${seq.toString().padStart(4, "0")}`;

  const { error: pubError } = await supabase.from("publications").insert({
    submission_id: submissionId,
    doi,
  });

  if (pubError) return { error: pubError.message };

  // Get submission info
  const { data: sub } = await supabase
    .from("submissions")
    .select("title, submitting_author_id")
    .eq("id", submissionId)
    .single();

  // Update submission status
  const { error: updateError } = await supabase
    .from("submissions")
    .update({ status: "published" })
    .eq("id", submissionId);

  if (updateError) return { error: updateError.message };

  // Notify author
  if (sub) {
    notify({
      userId: sub.submitting_author_id,
      type: "paper_published",
      title: "Paper Published",
      message: `Your paper "${sub.title}" has been published with DOI: ${doi}`,
      link: "/archive",
      emailData: { title: sub.title, doi },
    });
  }

  revalidatePath(`/dashboard/editor/submissions/${submissionId}`);
  revalidatePath("/dashboard/editor");
  revalidatePath("/archive");
  revalidatePath("/");
  return { success: true, doi };
}

export async function retractPaper(data: {
  publicationId: string;
  retractionNotice: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single();

  if (!profile?.roles?.includes("editor")) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("publications")
    .update({
      retracted: true,
      retraction_notice: data.retractionNotice,
    })
    .eq("id", data.publicationId);

  if (error) return { error: error.message };

  revalidatePath("/archive");
  return { success: true };
}
