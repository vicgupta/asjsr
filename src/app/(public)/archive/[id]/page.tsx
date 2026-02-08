import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaperPdfViewer } from "./paper-pdf-viewer";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pub } = await supabase
    .from("publications")
    .select("doi, submission:submissions!inner(title, abstract)")
    .eq("id", id)
    .single();

  if (!pub) return { title: "Paper Not Found" };

  const submission = pub.submission as any;
  return {
    title: submission?.title || "Paper",
    description: submission?.abstract?.slice(0, 200),
    openGraph: {
      title: submission?.title,
      description: submission?.abstract?.slice(0, 200),
      type: "article",
    },
  };
}

export default async function PaperPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pub } = await supabase
    .from("publications")
    .select(
      "*, submission:submissions!inner(id, title, abstract, keywords, co_authors, file_path, submitting_author_id, profiles:submitting_author_id(full_name, affiliation))"
    )
    .eq("id", id)
    .single();

  if (!pub) notFound();

  const submission = pub.submission as any;
  const author = submission?.profiles;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <article className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold">
            {submission.title}
            {pub.retracted && (
              <Badge variant="destructive" className="ml-2 text-sm">
                RETRACTED
              </Badge>
            )}
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            {author?.full_name || "Unknown Author"}
            {author?.affiliation && ` — ${author.affiliation}`}
          </p>

          {(submission.co_authors as any[])?.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Co-authors:{" "}
              {(submission.co_authors as any[])
                .map((ca: any) => ca.name)
                .join(", ")}
            </p>
          )}

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span>
              Published {new Date(pub.published_at).toLocaleDateString()}
            </span>
            {pub.doi && (
              <span>
                DOI:{" "}
                <a
                  href={`https://doi.org/${pub.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {pub.doi}
                </a>
              </span>
            )}
          </div>
        </header>

        {pub.retracted && pub.retraction_notice && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                Retraction Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{pub.retraction_notice}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Abstract</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{submission.abstract}</p>
          </CardContent>
        </Card>

        {submission.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {submission.keywords.map((kw: string) => (
              <Badge key={kw} variant="secondary">
                {kw}
              </Badge>
            ))}
          </div>
        )}

        {submission.file_path && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Full Text</h2>
              <PaperDownloadButton filePath={submission.file_path} />
            </div>
            <PaperPdfViewer filePath={submission.file_path} />
          </div>
        )}
      </article>
    </div>
  );
}

function PaperDownloadButton({ filePath }: { filePath: string }) {
  return (
    <form
      action={async () => {
        "use server";
        // Download handled client-side via PdfViewer
      }}
    >
      <Link href={`/api/download/${encodeURIComponent(filePath)}`} target="_blank">
        <Button variant="outline" size="sm">
          Download PDF
        </Button>
      </Link>
    </form>
  );
}
