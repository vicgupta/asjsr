import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReviewForm } from "./review-form";
import { PdfViewerWrapper } from "./pdf-viewer-wrapper";

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: review } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .single();

  if (!review) notFound();
  if (review.reviewer_id !== user.id) redirect("/dashboard/reviews");

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, title, abstract, keywords, co_authors, file_path, submitting_author_id")
    .eq("id", review.submission_id)
    .single();

  if (!submission) notFound();

  // Check double-blind mode
  const { data: settings } = await supabase
    .from("journal_settings")
    .select("review_type")
    .single();

  const isDoubleBlind = settings?.review_type === "double_blind";

  // In double-blind mode, strip author info
  let authorInfo = null;
  if (!isDoubleBlind) {
    const { data: author } = await supabase
      .from("profiles")
      .select("full_name, affiliation")
      .eq("id", submission.submitting_author_id)
      .single();
    authorInfo = author;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{submission.title}</h1>
          {!isDoubleBlind && authorInfo && (
            <p className="text-muted-foreground">
              by {authorInfo.full_name}
              {authorInfo.affiliation && ` — ${authorInfo.affiliation}`}
            </p>
          )}
          {isDoubleBlind && (
            <p className="text-sm text-muted-foreground italic">
              Double-blind review — author information hidden
            </p>
          )}
        </div>
        <Badge variant={review.submitted_at ? "default" : "secondary"}>
          {review.submitted_at ? "Submitted" : "Pending"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Abstract</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{submission.abstract}</p>
        </CardContent>
      </Card>

      {submission.keywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {submission.keywords.map((kw) => (
                <Badge key={kw} variant="secondary">
                  {kw}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isDoubleBlind && (submission.co_authors as any[])?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Co-Authors</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {(submission.co_authors as any[]).map(
                (ca: any, i: number) => (
                  <li key={i} className="text-sm">
                    {ca.name}
                    {ca.affiliation && (
                      <span className="text-muted-foreground">
                        {" — "}
                        {ca.affiliation}
                      </span>
                    )}
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {submission.file_path && (
        <Card>
          <CardHeader>
            <CardTitle>Manuscript</CardTitle>
          </CardHeader>
          <CardContent>
            <PdfViewerWrapper filePath={submission.file_path} />
          </CardContent>
        </Card>
      )}

      {review.deadline && (
        <p className="text-sm text-muted-foreground">
          Deadline: {new Date(review.deadline).toLocaleDateString()}
        </p>
      )}

      {review.submitted_at ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{review.content}</p>
            <p className="text-sm text-muted-foreground mt-4">
              Submitted {new Date(review.submitted_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ReviewForm reviewId={review.id} />
      )}
    </div>
  );
}
