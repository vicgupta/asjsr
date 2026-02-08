import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notifications";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find reviews that are:
  // 1. Not yet submitted
  // 2. Have a deadline approaching (within 3 days) or past due
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select(
      "id, reviewer_id, deadline, submission:submission_id(title)"
    )
    .is("submitted_at", null)
    .not("deadline", "is", null)
    .lte("deadline", threeDaysFromNow.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sentCount = 0;

  for (const review of reviews || []) {
    const submission = review.submission as any;
    await notify({
      userId: review.reviewer_id,
      type: "review_reminder",
      title: "Review Reminder",
      message: `Your review for "${submission?.title || "a manuscript"}" is ${
        new Date(review.deadline!) < new Date() ? "overdue" : "approaching its deadline"
      }.`,
      link: `/dashboard/reviews/${review.id}`,
      emailData: {
        title: submission?.title,
        deadline: review.deadline,
      },
    });
    sentCount++;
  }

  return NextResponse.json({
    success: true,
    reminders_sent: sentCount,
  });
}
