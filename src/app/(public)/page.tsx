import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  let publications: any[] | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("publications")
      .select(
        "*, submission:submissions(id, title, abstract, keywords, co_authors, submitting_author_id, profiles:submitting_author_id(full_name, affiliation))"
      )
      .eq("retracted", false)
      .order("published_at", { ascending: false })
      .limit(5);
    publications = data;
  } catch {
    // Supabase not available
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Academic Journal</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          A peer-reviewed platform for scholarly research. Submit manuscripts,
          participate in peer review, and access published papers.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/archive">
            <Button size="lg">Browse Archive</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">
              Submit a Paper
            </Button>
          </Link>
        </div>
      </section>

      {publications && publications.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Latest Publications</h2>
          <div className="space-y-4">
            {publications.map((pub) => {
              const submission = pub.submission as any;
              if (!submission) return null;
              const author = submission.profiles as any;
              return (
                <Link key={pub.id} href={`/archive/${pub.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {submission.title}
                      </CardTitle>
                      <CardDescription>
                        {author?.full_name || "Unknown Author"}
                        {author?.affiliation
                          ? ` — ${author.affiliation}`
                          : ""}
                        {" | "}
                        {new Date(pub.published_at).toLocaleDateString()}
                        {pub.doi && ` | DOI: ${pub.doi}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {submission.abstract}
                      </p>
                      {submission.keywords?.length > 0 && (
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
          <div className="text-center mt-6">
            <Link href="/archive">
              <Button variant="outline">View All Publications</Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
