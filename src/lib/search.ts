import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  author_name: string;
  author_affiliation: string;
  headline: string;
  rank: number;
}

export async function searchSubmissions(
  query: string,
  limit = 20,
  offset = 0
): Promise<{ results: SearchResult[]; total: number }> {
  const supabase = await createClient();

  if (!query.trim()) {
    return { results: [], total: 0 };
  }

  // Use websearch_to_tsquery for natural search syntax support
  const { data, error } = await supabase.rpc("search_publications", {
    search_query: query,
    result_limit: limit,
    result_offset: offset,
  });

  if (error) {
    console.error("Search error:", error);
    return { results: [], total: 0 };
  }

  return {
    results: (data as SearchResult[]) || [],
    total: data?.length || 0,
  };
}
