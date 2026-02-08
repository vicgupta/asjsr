import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WithdrawButton } from "./withdraw-button";
import type { SubmissionStatus } from "@/types/database";

const statusColors: Record<SubmissionStatus, string> = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  revision_requested: "bg-orange-100 text-orange-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-800",
  published: "bg-purple-100 text-purple-800",
};

export default async function SubmissionDetailPage({
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

  const { data: submission } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (!submission) notFound();

  // Get reviews visible to author (only after decision)
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, reviewer:reviewer_id(full_name)")
    .eq("submission_id", id);

  // Get decisions
  const { data: decisions } = await supabase
    .from("decisions")
    .select("*, editor:editor_id(full_name)")
    .eq("submission_id", id)
    .order("created_at", { ascending: false });

  const canWithdraw =
    submission.submitting_author_id === user.id &&
    !["published", "withdrawn"].includes(submission.status);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{submission.title}</h1>
          <p className="text-muted-foreground">
            Submitted {new Date(submission.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge className={statusColors[submission.status]}>
          {submission.status.replace("_", " ")}
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

      {(submission.co_authors as any[])?.length > 0 && (
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

      {decisions && decisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {decisions.map((d: any) => (
              <div key={d.id} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant={
                      d.decision === "accept"
                        ? "default"
                        : d.decision === "reject"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {d.decision}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    by {d.editor?.full_name || "Editor"} on{" "}
                    {new Date(d.created_at).toLocaleDateString()}
                  </span>
                </div>
                {d.notes && <p className="text-sm">{d.notes}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {reviews && reviews.length > 0 && decisions && decisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews
              .filter((r: any) => r.submitted_at)
              .map((r: any, i: number) => (
                <div
                  key={r.id}
                  className="border-b last:border-0 pb-4 last:pb-0"
                >
                  <p className="text-sm font-medium mb-1">Reviewer {i + 1}</p>
                  <p className="text-sm whitespace-pre-wrap">{r.content}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {canWithdraw && (
        <WithdrawButton submissionId={submission.id} />
      )}
    </div>
  );
}
