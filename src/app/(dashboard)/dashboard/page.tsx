import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome, {profile.full_name || "User"}
        </h1>
        <p className="text-muted-foreground">
          Your roles:{" "}
          {profile.roles.map((role) => (
            <Badge key={role} variant="secondary" className="mr-1">
              {role}
            </Badge>
          ))}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profile.roles.includes("author") && (
          <Link href="/dashboard/submissions">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">My Submissions</CardTitle>
                <CardDescription>
                  View and manage your manuscript submissions
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}

        {profile.roles.includes("reviewer") && (
          <Link href="/dashboard/reviews">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">My Reviews</CardTitle>
                <CardDescription>
                  Review assigned manuscripts
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}

        {profile.roles.includes("editor") && (
          <Link href="/dashboard/editor">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Editor Panel</CardTitle>
                <CardDescription>
                  Manage submissions, reviews, and publications
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}

        <Link href="/dashboard/profile">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
              <CardDescription>
                Update your profile information
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {profile.roles.includes("editor") && (
        <EditorMetrics />
      )}
    </div>
  );
}

async function EditorMetrics() {
  const supabase = await createClient();

  const [
    { count: submittedCount },
    { count: underReviewCount },
    { count: acceptedCount },
    { count: publishedCount },
    { data: overdueReviews },
  ] = await Promise.all([
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "under_review"),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "accepted"),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase
      .from("reviews")
      .select("id")
      .is("submitted_at", null)
      .lt("deadline", new Date().toISOString()),
  ]);

  const stats = [
    { label: "Submitted", value: submittedCount || 0 },
    { label: "Under Review", value: underReviewCount || 0 },
    { label: "Accepted", value: acceptedCount || 0 },
    { label: "Published", value: publishedCount || 0 },
    { label: "Overdue Reviews", value: overdueReviews?.length || 0 },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Editor Metrics</h2>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
