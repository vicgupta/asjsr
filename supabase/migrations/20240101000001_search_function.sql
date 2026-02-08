-- Search function for published papers
CREATE OR REPLACE FUNCTION search_publications(
  search_query TEXT,
  result_limit INT DEFAULT 20,
  result_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  abstract TEXT,
  keywords TEXT[],
  author_name TEXT,
  author_affiliation TEXT,
  headline TEXT,
  rank REAL
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    s.id,
    s.title,
    s.abstract,
    s.keywords,
    p.full_name AS author_name,
    p.affiliation AS author_affiliation,
    ts_headline('english', COALESCE(s.abstract, ''), websearch_to_tsquery('english', search_query),
      'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20'
    ) AS headline,
    ts_rank(s.search_vector, websearch_to_tsquery('english', search_query)) AS rank
  FROM submissions s
  JOIN profiles p ON p.id = s.submitting_author_id
  WHERE s.status = 'published'
    AND s.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT result_limit
  OFFSET result_offset;
$$;
