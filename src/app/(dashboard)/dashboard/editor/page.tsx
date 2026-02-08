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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const statusTabs: { value: string; label: string; statuses: SubmissionStatus[] }[] = [
  { value: "active", label: "Active", statuses: ["submitted", "under_review", "revision_requested"] },
  { value: "accepted", label: "Accepted", statuses: ["accepted"] },
  { value: "published", label: "Published", statuses: ["published"] },
  { value: "rejected", label: "Rejected", statuses: ["rejected"] },
  { value: "withdrawn", label: "Withdrawn", statuses: ["withdrawn"] },
  { value: "all", label: "All", statuses: [] },
];

export default async function EditorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: submissions } = await supabase
    .from("submissions")
    .select("*, author:submitting_author_id(full_name, email)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editor Panel</h1>

      <Tabs defaultValue="active">
        <TabsList>
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {statusTabs.map((tab) => {
          const filtered =
            tab.statuses.length === 0
              ? submissions
              : submissions?.filter((s) =>
                  tab.statuses.includes(s.status)
                );

          return (
            <TabsContent key={tab.value} value={tab.value}>
              {!filtered || filtered.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      No submissions in this category.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filtered.map((sub: any) => (
                    <Link
                      key={sub.id}
                      href={`/dashboard/editor/submissions/${sub.id}`}
                    >
                      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {sub.title}
                              </CardTitle>
                              <CardDescription>
                                by {sub.author?.full_name || sub.author?.email || "Unknown"}{" "}
                                | Submitted{" "}
                                {new Date(sub.created_at).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <Badge className={statusColors[sub.status as SubmissionStatus]}>
                              {sub.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {sub.abstract}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
