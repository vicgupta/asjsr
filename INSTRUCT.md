# ASJSR Implementation Plan

## Context

Building a greenfield peer-reviewed academic journal platform from an empty directory. The SPEC.md defines an MVP with: Next.js App Router + Supabase (Postgres/Storage/Auth) + Resend + Vercel. Three roles (Author, Reviewer, Editor), linear review workflow, full-text search, DOI minting via Crossref, WYSIWYG CMS, and embedded PDF viewer.

---

## Phase 1: Foundation

Bootable app with auth, database, and navigation.

1. `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir`
2. Install: `@supabase/ssr`, `@supabase/supabase-js`, shadcn/ui (button, input, card, badge, table, dialog, dropdown-menu, tabs, textarea, select, toast)
3. Initialize Supabase project (`npx supabase init`)
4. Create database migrations:
   - Enum types: `user_role`, `submission_status`, `review_type`, `decision_type`, `cms_page_type`, `notification_type`
   - Tables: `profiles`, `submissions`, `reviews`, `decisions`, `publications`, `cms_pages`, `notifications`, `journal_settings`
   - Indexes: GIN on `search_vector`, GIN on `profiles.roles`, standard B-tree on FKs and status columns
   - Triggers: `handle_new_user` (auto-create profile on signup), `submissions_search_vector_update` (auto-maintain tsvector)
   - RLS policies for all tables + helper functions (`has_role()`, `is_double_blind()`)
   - Storage buckets: `manuscripts` (private, 100MB limit), `journal-assets` (public, 5MB limit) with storage RLS
   - Seed: default `journal_settings` row
5. Supabase client utilities: `src/lib/supabase/{client,server,admin,middleware}.ts`
6. `middleware.ts` — session refresh + route protection (public routes open, `/dashboard/*` requires auth, `/editor/*` requires editor role)
7. Route group layouts: `(public)`, `(auth)`, `(dashboard)`
8. Auth pages: `/login`, `/register`, `/forgot-password`, `/auth/callback`
9. Dashboard sidebar (role-aware: authors see "My Submissions", reviewers see "My Reviews", editors see "Editor Panel")
10. Profile page at `/dashboard/profile`

**Test:** Register, login, see role-based dashboard nav, edit profile.

---

## Phase 2: Submission Flow

Authors submit manuscripts. Editors see the queue.

1. Submission form at `/dashboard/submissions/new`: title, abstract, keywords (tag input), co-authors (dynamic name+affiliation rows), PDF upload
2. File upload: use `@supabase/supabase-js` `storage.upload()` directly from browser to Supabase Storage. Path: `manuscripts/{user_id}/{submission_id}/{filename}`. Client-side validation: PDF only, ≤100MB.
3. Server action `createSubmission`: insert row, return ID for client-side upload
4. Server action `updateSubmissionFile`: set `file_path` after upload completes
5. Author submission list at `/dashboard/submissions` with status badges
6. Author submission detail at `/dashboard/submissions/[id]` with withdraw button
7. Server action `withdrawSubmission`: set status to `withdrawn`
8. Editor submission queue at `/dashboard/editor` with status filter tabs
9. Editor submission detail at `/dashboard/editor/submissions/[id]`
10. Generate TypeScript types: `npx supabase gen types typescript`

**Test:** Author submits PDF with metadata, sees it listed. Editor sees all submissions filtered by status.

---

## Phase 3: Peer Review Workflow

Editor assigns reviewers, reviewers submit reviews, editor decides.

1. Reviewer assignment UI in editor submission detail: search users by name, assign with deadline (default from `journal_settings.default_review_deadline_days`)
2. Server action `assignReviewer`: insert review row, COI check (cannot assign submitting author)
3. Auto-transition: submission status → `under_review` when first reviewer assigned
4. Reviewer list at `/dashboard/reviews` showing assigned submissions + deadlines
5. Review page at `/dashboard/reviews/[id]`: embedded PDF viewer (pdf.js) + freeform text textarea + submit button
6. Double-blind enforcement: server action strips `submitting_author_id` and `co_authors` from data sent to reviewer when journal is in `double_blind` mode
7. Server action `submitReview`: set `content` and `submitted_at`
8. Editor sees submitted reviews in submission detail page
9. Decision form: Accept/Reject radio + optional notes textarea
10. Server action `issueDecision`: insert decision, update submission status, reviews now visible to author (RLS policy checks for decision existence)

**Test:** Full cycle: assign reviewer → reviewer reads paper & submits review → editor sees review & decides → author sees decision + reviews.

---

## Phase 4: PDF Text Extraction + Search

Full-text search across published papers.

1. Supabase Edge Function `extract-pdf-text`: downloads PDF from storage, extracts text with `unpdf`, updates `extracted_text` column
2. Database trigger using `pg_net`: fires Edge Function when `file_path` is set on a submission
3. Search helper `src/lib/search.ts`: convert user input to `plainto_tsquery` or `websearch_to_tsquery`, query against `search_vector`
4. Public search page at `/search` with search bar and results (title, author, abstract snippet with highlights via `ts_headline`)
5. Search bar in public header for quick access

**Test:** Upload PDF, wait for extraction, search for a phrase from the PDF content — it appears in results.

---

## Phase 5: Publishing + DOI + Public Archive

Editor publishes papers. Public archive with embedded PDF viewer.

1. Server action `publishPaper`: generate DOI (`{prefix}/asjsr.{year}.{seq}`), create `publications` row, update submission status to `published`
2. Crossref deposit: `src/lib/crossref/deposit.ts` builds XML, `submit.ts` POSTs to Crossref HTTPS endpoint
3. Retraction: server action `retractPaper` sets `retracted=true` with notice text
4. Public archive at `/archive`: paginated list of published papers (title, authors, date, DOI, keywords)
5. Paper page at `/archive/[id]`: metadata + embedded pdf.js viewer + download button + DOI link
6. `pdf-viewer.tsx`: client component wrapping pdfjs-dist
7. Public homepage showing latest publications
8. Open Graph meta tags on paper pages

**Test:** Editor publishes accepted paper → DOI minted → paper appears in public archive with embedded viewer.

---

## Phase 6: Notifications + Email

Email and in-app notifications for all workflow events.

1. Install `resend` + `@react-email/components`
2. Email templates (React Email): submission received, reviewer assigned, review submitted, decision made, paper published, submission withdrawn, review reminder
3. `notify()` utility: dual-write to `notifications` table + send email via Resend
4. Integrate into all existing server actions
5. Notification bell in dashboard header (unread count, fetched on page load)
6. Notification inbox page at `/dashboard/notifications` with mark-as-read
7. Vercel Cron (`/api/cron/review-reminders`) runs daily: queries overdue/approaching-deadline reviews, sends reminder emails
8. `vercel.json` cron config

**Test:** Every workflow action sends email + creates in-app notification. Overdue reviews get reminder emails.

---

## Phase 7: CMS + Journal Settings

Editor-managed content pages and journal configuration.

1. Install TipTap: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`
2. `tiptap-editor.tsx`: WYSIWYG editor with toolbar (headings, bold, italic, lists, links, images, blockquotes)
3. CMS CRUD at `/dashboard/editor/cms/*`: list, create, edit pages
4. Store `content_json` (TipTap JSON, source of truth) + `content_html` (pre-rendered for serving)
5. Public rendering at `/[slug]`: server component renders sanitized `content_html` with `sanitize-html`
6. Journal settings form at `/dashboard/editor/settings`: name, logo, primary color, review type, default deadline, DOI prefix, Crossref credentials
7. Theme provider: reads `journal_settings`, applies primary color via CSS variables
8. Public header/footer: dynamic journal name + logo from settings

**Test:** Editor creates "About" page → renders on public site. Editor changes journal name/color → site updates.

---

## Phase 8: ORCID Integration + Polish

ORCID login and overall refinement.

1. ORCID OAuth flow: redirect to `orcid.org/oauth/authorize`, callback exchanges code for token, resolve/create user
2. "Sign in with ORCID" button on login/register pages
3. ORCID linking on profile page
4. Editor dashboard metrics: submission counts by status, overdue reviews, avg review time
5. Loading states, error boundaries, empty states across all pages
6. Responsive design pass
7. RLS policy testing (attempt unauthorized access in each role)
8. Double-blind mode testing

**Test:** ORCID login works. Full end-to-end workflow is polished.

---

## Key Architectural Decisions

| Decision | Approach |
|---|---|
| **Auth** | Supabase Auth for email/password. Custom ORCID OAuth flow via route handler (ORCID isn't a built-in Supabase provider). |
| **File uploads** | Direct browser → Supabase Storage upload (bypasses Vercel's 4.5MB body limit). Client-side PDF/size validation. |
| **PDF extraction** | Supabase Edge Function triggered by `pg_net` database webhook. Runs async, doesn't block submission. |
| **Full-text search** | Postgres tsvector/tsquery with weighted columns (title A > abstract B > keywords B > authors C > full text D). GIN index. |
| **Double-blind** | Application-layer enforcement. Reviewer RLS grants row access (they need title/abstract), but server actions strip author fields before sending to client. |
| **DOI minting** | Generate Crossref Schema 5.x XML at publish time, POST to Crossref deposit endpoint. Retry via editor UI if deposit fails. |
| **Roles** | `user_role[]` array on profiles table. `has_role()` SQL function used in all RLS policies. No JWT custom claims. |
| **CMS** | TipTap JSON stored as source of truth + pre-rendered HTML for serving. Sanitized before rendering. |
| **Notifications** | Dual-write: in-app (DB insert) + email (Resend). Review reminders via Vercel Cron. No real-time push in MVP. |
| **Mutations** | Server Actions for all UI-triggered mutations. API routes only for webhooks and cron jobs. |

---

## Verification

After each phase, verify by:
1. Running the dev server (`npm run dev`)
2. Testing the described user flows manually
3. Checking RLS by logging in as different roles and attempting unauthorized access
4. Running `npx supabase db lint` to validate migrations
5. After Phase 5+: full end-to-end test — register → submit → assign reviewer → review → decide → publish → search → view on public archive
