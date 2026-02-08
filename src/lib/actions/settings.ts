"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ReviewType } from "@/types/database";

export async function updateJournalSettings(data: {
  journalName: string;
  primaryColor: string;
  reviewType: ReviewType;
  defaultReviewDeadlineDays: number;
  doiPrefix: string;
  crossrefUsername: string;
  crossrefPassword: string;
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

  // Get existing settings row
  const { data: existing } = await supabase
    .from("journal_settings")
    .select("id")
    .single();

  if (!existing) return { error: "Settings not found" };

  const { error } = await supabase
    .from("journal_settings")
    .update({
      journal_name: data.journalName,
      primary_color: data.primaryColor,
      review_type: data.reviewType,
      default_review_deadline_days: data.defaultReviewDeadlineDays,
      doi_prefix: data.doiPrefix,
      crossref_username: data.crossrefUsername || null,
      crossref_password: data.crossrefPassword || null,
    })
    .eq("id", existing.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
