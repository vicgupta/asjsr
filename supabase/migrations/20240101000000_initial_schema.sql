-- Enum types
CREATE TYPE user_role AS ENUM ('author', 'reviewer', 'editor');
CREATE TYPE submission_status AS ENUM (
  'submitted', 'under_review', 'revision_requested',
  'accepted', 'rejected', 'withdrawn', 'published'
);
CREATE TYPE review_type AS ENUM ('single_blind', 'double_blind');
CREATE TYPE decision_type AS ENUM ('accept', 'reject', 'revise');
CREATE TYPE cms_page_type AS ENUM ('static', 'policy', 'guide');
CREATE TYPE notification_type AS ENUM (
  'submission_received', 'reviewer_assigned', 'review_submitted',
  'decision_made', 'paper_published', 'submission_withdrawn',
  'review_reminder', 'revision_requested'
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  affiliation TEXT DEFAULT '',
  orcid_id TEXT,
  roles user_role[] NOT NULL DEFAULT '{author}',
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_roles ON profiles USING GIN (roles);
CREATE UNIQUE INDEX idx_profiles_orcid ON profiles (orcid_id) WHERE orcid_id IS NOT NULL;

-- Submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  abstract TEXT NOT NULL DEFAULT '',
  keywords TEXT[] DEFAULT '{}',
  co_authors JSONB DEFAULT '[]',
  submitting_author_id UUID NOT NULL REFERENCES profiles(id),
  file_path TEXT,
  status submission_status NOT NULL DEFAULT 'submitted',
  extracted_text TEXT,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_submissions_status ON submissions (status);
CREATE INDEX idx_submissions_author ON submissions (submitting_author_id);
CREATE INDEX idx_submissions_search ON submissions USING GIN (search_vector);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT,
  deadline TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(submission_id, reviewer_id)
);

CREATE INDEX idx_reviews_submission ON reviews (submission_id);
CREATE INDEX idx_reviews_reviewer ON reviews (reviewer_id);

-- Decisions table
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES profiles(id),
  decision decision_type NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_decisions_submission ON decisions (submission_id);

-- Publications table
CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) UNIQUE,
  doi TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  retracted BOOLEAN NOT NULL DEFAULT false,
  retraction_notice TEXT,
  volume INT,
  issue INT,
  crossref_deposit_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_publications_doi ON publications (doi) WHERE doi IS NOT NULL;

-- CMS Pages table
CREATE TABLE cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  page_type cms_page_type NOT NULL DEFAULT 'static',
  content_json JSONB DEFAULT '{}',
  content_html TEXT DEFAULT '',
  published BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cms_pages_slug ON cms_pages (slug);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications (user_id);
CREATE INDEX idx_notifications_unread ON notifications (user_id) WHERE read = false;

-- Journal Settings table (singleton)
CREATE TABLE journal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_name TEXT NOT NULL DEFAULT 'Academic Journal',
  journal_logo_url TEXT,
  primary_color TEXT DEFAULT '#1e40af',
  review_type review_type NOT NULL DEFAULT 'double_blind',
  default_review_deadline_days INT NOT NULL DEFAULT 21,
  doi_prefix TEXT DEFAULT '10.XXXXX',
  crossref_username TEXT,
  crossref_password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper functions
CREATE OR REPLACE FUNCTION has_role(user_id UUID, required_role user_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND required_role = ANY(roles)
  );
$$;

CREATE OR REPLACE FUNCTION is_double_blind()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM journal_settings
    WHERE review_type = 'double_blind'
    LIMIT 1
  );
$$;

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: auto-update search vector
CREATE OR REPLACE FUNCTION submissions_search_vector_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.abstract, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.extracted_text, '')), 'D');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER submissions_search_update
  BEFORE INSERT OR UPDATE OF title, abstract, keywords, extracted_text
  ON submissions
  FOR EACH ROW EXECUTE FUNCTION submissions_search_vector_update();

-- Updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER cms_pages_updated_at
  BEFORE UPDATE ON cms_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER journal_settings_updated_at
  BEFORE UPDATE ON journal_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Submissions policies
CREATE POLICY "Authors can view their own submissions"
  ON submissions FOR SELECT
  USING (
    submitting_author_id = auth.uid()
    OR has_role(auth.uid(), 'editor')
    OR EXISTS (
      SELECT 1 FROM reviews WHERE reviews.submission_id = submissions.id AND reviews.reviewer_id = auth.uid()
    )
  );

CREATE POLICY "Published submissions are public"
  ON submissions FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authors can insert submissions"
  ON submissions FOR INSERT
  WITH CHECK (submitting_author_id = auth.uid());

CREATE POLICY "Authors can update their own pending submissions"
  ON submissions FOR UPDATE
  USING (
    submitting_author_id = auth.uid()
    OR has_role(auth.uid(), 'editor')
  );

-- Reviews policies
CREATE POLICY "Reviewers can view their own reviews"
  ON reviews FOR SELECT
  USING (
    reviewer_id = auth.uid()
    OR has_role(auth.uid(), 'editor')
    OR (
      EXISTS (
        SELECT 1 FROM submissions s
        WHERE s.id = reviews.submission_id
        AND s.submitting_author_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM decisions d WHERE d.submission_id = s.id
        )
      )
    )
  );

CREATE POLICY "Editors can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'editor'));

CREATE POLICY "Reviewers can update their own reviews"
  ON reviews FOR UPDATE
  USING (reviewer_id = auth.uid());

-- Decisions policies
CREATE POLICY "Editors and submission authors can view decisions"
  ON decisions FOR SELECT
  USING (
    has_role(auth.uid(), 'editor')
    OR EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = decisions.submission_id
      AND s.submitting_author_id = auth.uid()
    )
  );

CREATE POLICY "Editors can insert decisions"
  ON decisions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'editor'));

-- Publications policies
CREATE POLICY "Publications are viewable by everyone"
  ON publications FOR SELECT USING (true);

CREATE POLICY "Editors can insert publications"
  ON publications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can update publications"
  ON publications FOR UPDATE
  USING (has_role(auth.uid(), 'editor'));

-- CMS pages policies
CREATE POLICY "Published CMS pages are viewable by everyone"
  ON cms_pages FOR SELECT
  USING (published = true OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can manage CMS pages"
  ON cms_pages FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can update CMS pages"
  ON cms_pages FOR UPDATE
  USING (has_role(auth.uid(), 'editor'));

CREATE POLICY "Editors can delete CMS pages"
  ON cms_pages FOR DELETE
  USING (has_role(auth.uid(), 'editor'));

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Journal settings policies
CREATE POLICY "Journal settings are viewable by everyone"
  ON journal_settings FOR SELECT USING (true);

CREATE POLICY "Editors can update journal settings"
  ON journal_settings FOR UPDATE
  USING (has_role(auth.uid(), 'editor'));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('manuscripts', 'manuscripts', false, 104857600),
  ('journal-assets', 'journal-assets', true, 5242880);

-- Storage policies
CREATE POLICY "Authors can upload manuscripts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'manuscripts'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Authors and editors can view manuscripts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'manuscripts'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR has_role(auth.uid(), 'editor')
      OR has_role(auth.uid(), 'reviewer')
    )
  );

CREATE POLICY "Anyone can view journal assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'journal-assets');

CREATE POLICY "Editors can upload journal assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'journal-assets'
    AND has_role(auth.uid(), 'editor')
  );

CREATE POLICY "Editors can delete journal assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'journal-assets'
    AND has_role(auth.uid(), 'editor')
  );

-- Seed: default journal settings
INSERT INTO journal_settings (journal_name) VALUES ('Academic Journal');
