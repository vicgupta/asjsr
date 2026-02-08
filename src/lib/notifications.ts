import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationType } from "@/types/database";
import {
  SubmissionReceivedEmail,
  ReviewerAssignedEmail,
  ReviewSubmittedEmail,
  DecisionMadeEmail,
  PaperPublishedEmail,
  SubmissionWithdrawnEmail,
  ReviewReminderEmail,
} from "@/lib/email/templates";
import { createElement } from "react";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "re_placeholder");
}
const emailFrom = process.env.EMAIL_FROM || "noreply@journal.example";

interface NotifyParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  emailData?: Record<string, any>;
}

export async function notify(params: NotifyParams) {
  const supabase = createAdminClient();

  // Insert in-app notification
  await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link,
  });

  // Send email
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", params.userId)
      .single();

    if (!profile?.email) return;

    let emailComponent: React.ReactElement | null = null;

    switch (params.type) {
      case "submission_received":
        emailComponent = createElement(SubmissionReceivedEmail, {
          title: params.emailData?.title || params.title,
        });
        break;
      case "reviewer_assigned":
        emailComponent = createElement(ReviewerAssignedEmail, {
          title: params.emailData?.title || params.title,
          deadline: params.emailData?.deadline || "",
        });
        break;
      case "review_submitted":
        emailComponent = createElement(ReviewSubmittedEmail, {
          title: params.emailData?.title || params.title,
          reviewerName: params.emailData?.reviewerName || "Reviewer",
        });
        break;
      case "decision_made":
        emailComponent = createElement(DecisionMadeEmail, {
          title: params.emailData?.title || params.title,
          decision: params.emailData?.decision || "",
          notes: params.emailData?.notes,
        });
        break;
      case "paper_published":
        emailComponent = createElement(PaperPublishedEmail, {
          title: params.emailData?.title || params.title,
          doi: params.emailData?.doi || "",
        });
        break;
      case "submission_withdrawn":
        emailComponent = createElement(SubmissionWithdrawnEmail, {
          title: params.emailData?.title || params.title,
        });
        break;
      case "review_reminder":
        emailComponent = createElement(ReviewReminderEmail, {
          title: params.emailData?.title || params.title,
          deadline: params.emailData?.deadline || "",
        });
        break;
    }

    if (emailComponent && process.env.RESEND_API_KEY) {
      await getResend().emails.send({
        from: emailFrom,
        to: profile.email,
        subject: params.title,
        react: emailComponent,
      });
    }
  } catch (err) {
    console.error("Email send failed:", err);
  }
}
