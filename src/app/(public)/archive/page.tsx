import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ArchivePage() {
  const supabase = await createClient();

  const { data: publications } = await supabase
    .from("publications")
    .select(
      "*, submission:submissions!inner(id, title, abstract, keywords, co_authors, submitting_author_id, profiles:submitting_author_id(full_name, affiliation))"
    )
    .order("published_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Publication Archive</h1>

      {!publications || publications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No publications yet. Check back soon.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {publications.map((pub: any) => {
            const submission = pub.submission;
            const author = submission?.profiles;

            return (
              <Link key={pub.id} href={`/archive/${pub.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {submission?.title}
                          {pub.retracted && (
                            <Badge variant="destructive" className="ml-2">
                              RETRACTED
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {author?.full_name || "Unknown Author"}
                          {author?.affiliation && ` — ${author.affiliation}`}
                          {" | "}
                          {new Date(pub.published_at).toLocaleDateString()}
                          {pub.doi && (
                            <>
                              {" | DOI: "}
                              {pub.doi}
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {submission?.abstract}
                    </p>
                    {submission?.keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {submission.keywords.map((kw: string) => (
                          <Badge key={kw} variant="outline" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    )}
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
