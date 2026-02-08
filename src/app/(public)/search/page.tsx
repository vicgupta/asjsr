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
import { SearchForm } from "./search-form";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q || "";

  let results: any[] = [];

  if (query.trim()) {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("search_publications", {
      search_query: query,
      result_limit: 20,
      result_offset: 0,
    });

    if (!error && data) {
      results = data;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Search Publications</h1>

      <SearchForm initialQuery={query} />

      {query && (
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-4">
            {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
          </p>

          {results.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No results found. Try different keywords.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((r: any) => (
                <Link key={r.id} href={`/archive/${r.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">{r.title}</CardTitle>
                      <CardDescription>
                        {r.author_name}
                        {r.author_affiliation && ` — ${r.author_affiliation}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="text-sm text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: r.headline }}
                      />
                      {r.keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {r.keywords.map((kw: string) => (
                            <Badge
                              key={kw}
                              variant="outline"
                              className="text-xs"
                            >
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
      )}
    </div>
  );
}
