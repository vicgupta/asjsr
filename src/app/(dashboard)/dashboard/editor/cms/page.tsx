import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CmsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: pages } = await supabase
    .from("cms_pages")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">CMS Pages</h1>
        <Link href="/dashboard/editor/cms/new">
          <Button>New Page</Button>
        </Link>
      </div>

      {!pages || pages.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              No CMS pages created yet.
            </p>
            <Link href="/dashboard/editor/cms/new">
              <Button>Create Your First Page</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pages.map((page) => (
            <Link key={page.id} href={`/dashboard/editor/cms/${page.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{page.title}</CardTitle>
                      <CardDescription>
                        /{page.slug} | {page.page_type} |{" "}
                        {new Date(page.updated_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={page.published ? "default" : "secondary"}>
                      {page.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
