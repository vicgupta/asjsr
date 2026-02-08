-- Fix infinite recursion between submissions and reviews RLS policies.
-- The submissions SELECT policy queries reviews, whose SELECT policy
-- queries submissions back → cycle. Break it with SECURITY DEFINER
-- helper functions that bypass RLS on the target table.

-- Helper: check if a user is an assigned reviewer for a submission
CREATE OR REPLACE FUNCTION is_reviewer_for(sub_id UUID, reviewer UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reviews
    WHERE submission_id = sub_id AND reviewer_id = reviewer
  );
$$;

-- Helper: check if a user is the author of a submission that has a decision
CREATE OR REPLACE FUNCTION is_author_with_decision(sub_id UUID, author UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = sub_id
      AND s.submitting_author_id = author
      AND EXISTS (SELECT 1 FROM public.decisions d WHERE d.submission_id = s.id)
  );
$$;

-- Drop the old policies that cause recursion
DROP POLICY IF EXISTS "Authors can view their own submissions" ON submissions;
DROP POLICY IF EXISTS "Reviewers can view their own reviews" ON reviews;

-- Recreate submissions SELECT policy using the helper function
CREATE POLICY "Authors can view their own submissions"
  ON submissions FOR SELECT
  USING (
    submitting_author_id = auth.uid()
    OR has_role(auth.uid(), 'editor')
    OR is_reviewer_for(id, auth.uid())
  );

-- Recreate reviews SELECT policy using the helper function
CREATE POLICY "Reviewers can view their own reviews"
  ON reviews FOR SELECT
  USING (
    reviewer_id = auth.uid()
    OR has_role(auth.uid(), 'editor')
    OR is_author_with_decision(submission_id, auth.uid())
  );
