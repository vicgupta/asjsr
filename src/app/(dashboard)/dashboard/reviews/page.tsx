import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, submission:submission_id(title, abstract)")
    .eq("reviewer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Reviews</h1>

      {!reviews || reviews.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              You have no review assignments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => {
            const isOverdue =
              !review.submitted_at &&
              review.deadline &&
              new Date(review.deadline) < new Date();

            return (
              <Link key={review.id} href={`/dashboard/reviews/${review.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {review.submission?.title || "Untitled"}
                        </CardTitle>
                        <CardDescription>
                          Assigned{" "}
                          {new Date(review.created_at).toLocaleDateString()}
                          {review.deadline && (
                            <>
                              {" | Deadline: "}
                              {new Date(review.deadline).toLocaleDateString()}
                            </>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {review.submitted_at ? (
                          <Badge className="bg-green-100 text-green-800">
                            Submitted
                          </Badge>
                        ) : isOverdue ? (
                          <Badge variant="destructive">Overdue</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {review.submission?.abstract}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
