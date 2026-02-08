import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export default async function SubmissionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("submitting_author_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Submissions</h1>
        <Link href="/dashboard/submissions/new">
          <Button>New Submission</Button>
        </Link>
      </div>

      {!submissions || submissions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              You haven&apos;t submitted any manuscripts yet.
            </p>
            <Link href="/dashboard/submissions/new">
              <Button>Submit Your First Manuscript</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <Link key={sub.id} href={`/dashboard/submissions/${sub.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{sub.title}</CardTitle>
                      <CardDescription>
                        Submitted{" "}
                        {new Date(sub.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[sub.status]}>
                      {sub.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {sub.abstract}
                  </p>
                  {sub.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sub.keywords.map((kw) => (
                        <Badge key={kw} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
