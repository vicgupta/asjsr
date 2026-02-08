# ASJSR - Academic Journal Publishing Platform

## Overview

A web application for managing a traditional peer-reviewed, multidisciplinary academic journal. The platform handles the full lifecycle from manuscript submission through peer review to open-access publication, with a public-facing journal site that includes a CMS for editorial content.

**Access Model:** Fully open access — all published papers are freely accessible. No paywall, no APCs.

**Scope:** MVP — core workflow first, launch fast, iterate later.

---

## Tech Stack

| Layer            | Technology                     |
| ---------------- | ------------------------------ |
| Framework        | Next.js (App Router)           |
| Database         | PostgreSQL via Supabase        |
| File Storage     | Supabase Storage               |
| Authentication   | Supabase Auth (email/password + ORCID OAuth) |
| Email            | Resend                         |
| Search           | PostgreSQL full-text search    |
| PDF Viewer       | pdf.js (embedded in-browser)   |
| CMS Editor       | TipTap or Plate (WYSIWYG)      |
| Deployment       | Vercel                         |

---

## User Roles

Three roles. A single user account can hold multiple roles simultaneously (e.g., a person can be an author on one paper and a reviewer on another).

| Role       | Description                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| **Author** | Submits manuscripts, tracks submission status, views decisions and reviews  |
| **Reviewer** | Receives assignments from the editor, submits freeform reviews           |
| **Editor** | Manages the entire editorial workflow, assigns reviewers, makes decisions, manages CMS content, configures journal settings |

### Conflict-of-Interest Safeguards

- **Basic:** The system prevents a user from being assigned as a reviewer on their own submission.
- No automated COI detection (co-authorship, institutional affiliation) in v1.

---

## Authentication

- **Email/password** registration and login via Supabase Auth.
- **ORCID OAuth** login/registration (standard in academic publishing).
- Users can link both methods to the same account.

---

## Manuscript Submission

### Submission Format
- **PDF only.** Authors upload a single PDF file.
- Maximum file size: **100 MB**.
- No in-browser composition, no Word/LaTeX upload.

### Submission Metadata (Minimal)
- Title
- Abstract
- Keywords (free-form tags)
- Author list (submitting author's account + co-author names/affiliations as plain text metadata — co-authors do not need accounts)

### Co-Authors
- The submitting author enters co-author names and affiliations as metadata fields.
- Co-authors do not have linked accounts and cannot view submission status.
- Only the submitting (corresponding) author interacts with the system.

### Withdrawal
- Authors can withdraw a pending submission at any point before a decision is issued.
- Withdrawn submissions are marked as such and are no longer visible to reviewers.

---

## Peer Review Workflow

### Review Type Configuration
- **Journal-wide setting**, configured by the editor. Applies uniformly to all submissions.
- Options: **Single-blind**, **Double-blind**, or **Open review**.
- For double-blind: the system hides author metadata (name, affiliation, email) from the reviewer's view of the submission. The same uploaded PDF is served — authors are instructed via submission guidelines to self-anonymize their manuscripts.

### Submission Lifecycle (Linear Flow)

```
Submitted → Under Review → Decision (Accept / Reject) → Published (if accepted)
```

| State            | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| **Submitted**    | Author has submitted the manuscript. Awaiting editor action.                |
| **Under Review** | Editor has assigned at least one reviewer. Reviews in progress.             |
| **Accepted**     | Editor has accepted the paper. Ready to publish.                            |
| **Rejected**     | Editor has rejected the paper. Terminal state.                              |
| **Published**    | Paper is live on the public archive with a DOI. Terminal state.             |
| **Withdrawn**    | Author withdrew the submission. Terminal state.                             |
| **Retracted**    | Editor retracted a previously published paper. Retraction notice displayed. |

- **No revision rounds.** The flow is strictly linear — no "revise and resubmit."
- **Binary decision only:** Accept or Reject. No "minor revisions" or conditional acceptance.

### Reviewer Assignment
- **Manual only.** Editor selects reviewers from registered users and assigns them directly.
- No system-suggested reviewers, no reviewer self-selection.
- **Direct assignment** — reviewers are immediately granted access upon assignment. No accept/decline step.
- **Flexible count** — editor assigns as many reviewers as they see fit per submission.

### Review Form
- **Freeform text only.** No structured scoring criteria, no rating scales.
- Reviewer submits a single text block as their review.

### Review Visibility
- Reviews are **not visible to the author until the editor issues a decision** (accept or reject).
- Once the editor makes a decision, all reviews for that submission are released to the author.
- The editor can view all reviews at any time.

### Review Deadlines
- **Soft deadlines.** Editor sets a due date when assigning a reviewer.
- Configurable journal-wide default deadline (e.g., 30 days from assignment).
- Automatic email reminders sent as the deadline approaches and when overdue.
- No enforcement — overdue reviews remain active, no auto-expiry.

---

## Publishing

### Publication Flow
- **Instant publish.** When the editor clicks "Publish" on an accepted paper, it goes live immediately.
- The original submitted PDF becomes the published version — no separate typesetting or final version upload step.

### DOI Assignment
- DOIs registered through a **sponsoring organization** via Crossref.
- The system generates Crossref-compatible metadata deposit XML using the sponsor's DOI prefix.
- DOI is minted at the time of publication.
- Each published paper displays its DOI prominently.

### Retraction
- Editor can retract a published paper.
- Retracted papers remain in the archive but are clearly marked with a **retraction notice**.
- The PDF remains accessible (standard academic practice) but the retraction is prominently displayed.

---

## Public-Facing Journal Site

### Paper Archive
- Searchable, browsable list of all published papers.
- Each paper page displays: title, authors, abstract, keywords, publication date, DOI, and an **embedded PDF viewer** (pdf.js) with a download button.
- **Full-text search** across paper content:
  - Background job extracts text from uploaded PDFs (using `pdf-parse` or similar) at upload time.
  - Extracted text stored in PostgreSQL and indexed using Postgres full-text search (`tsvector`/`tsquery`).
  - Search covers title, abstract, keywords, author names, and extracted full text.

### CMS Pages (Editor-Managed)
The editor manages the following pages via a **WYSIWYG editor** (TipTap or Plate):
- **About** — journal description, scope, history
- **Editorial Board** — list of board members with roles and affiliations
- **Submission Guidelines** — instructions for authors (formatting, anonymization, etc.)
- **News / Announcements** — blog-style posts (call for papers, special issues, updates)

CMS pages are created and edited by the Editor role. No separate admin role.

### Branding
- No existing branding — the system needs a **clean, professional default theme**.
- Journal name, logo, and colors should be configurable by the editor via journal settings.

### Citation Metadata
- **Not a priority for MVP.** Standard SEO meta tags only (title, description, Open Graph).
- Highwire Press tags, Dublin Core, JATS XML deferred to a future version.

---

## Notifications

### Dual Channel: Email + In-App

| Event                        | Email | In-App |
| ---------------------------- | ----- | ------ |
| New submission (to editor)   | Yes   | Yes    |
| Reviewer assigned            | Yes   | Yes    |
| Review deadline reminder     | Yes   | No     |
| Review submitted (to editor) | Yes   | Yes    |
| Decision made (to author)    | Yes   | Yes    |
| Paper published (to author)  | Yes   | Yes    |
| Submission withdrawn         | Yes   | Yes    |

### Email
- Transactional email via **Resend**.
- Deadline reminders: sent at configurable intervals (e.g., 7 days before, 1 day before, and 1 day after deadline).

### In-App Notifications
- Simple notification list/inbox accessible from the navigation bar.
- MVP approach: notifications fetched on page load (no real-time push, no WebSockets, no polling). Optimize later.

---

## Editor Dashboard

### Submission Queue
- List of all submissions filterable by status (Submitted, Under Review, Accepted, Rejected, Published, Withdrawn).
- Each submission shows: title, submitting author, submission date, current status, assigned reviewers, review status.

### Key Metrics
- Count of submissions by status (pending, under review, decided, published).
- Number of overdue reviews.
- Average review turnaround time.
- These are simple aggregate queries, not charted analytics.

### Actions
- Assign reviewers to a submission.
- View submitted reviews.
- Issue a decision (Accept / Reject) — releases reviews to the author.
- Publish an accepted paper (triggers DOI minting and makes it live).
- Retract a published paper.

---

## Journal Settings (Editor-Configurable)

| Setting                  | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| Journal name             | Displayed in header, emails, and metadata             |
| Journal logo             | Uploaded image for the site header                    |
| Primary color            | Theme accent color                                    |
| Review type              | Single-blind, Double-blind, or Open review            |
| Default review deadline  | Number of days reviewers have to submit (e.g., 30)    |
| DOI prefix               | Provided by the sponsoring Crossref member            |
| Submission guidelines URL | Link or CMS page for author guidelines               |

---

## Data Model (Core Entities)

### Users
- `id`, `email`, `name`, `affiliation`, `orcid_id`, `role` (author | reviewer | editor — can hold multiple), `created_at`

### Submissions
- `id`, `title`, `abstract`, `keywords[]`, `submitting_author_id` (FK → Users), `co_authors` (JSON array of {name, affiliation}), `status` (submitted | under_review | accepted | rejected | published | withdrawn | retracted), `file_path` (Supabase Storage reference), `extracted_text` (for FTS), `search_vector` (tsvector), `created_at`, `updated_at`

### Reviews
- `id`, `submission_id` (FK → Submissions), `reviewer_id` (FK → Users), `content` (freeform text), `deadline`, `submitted_at`, `created_at`

### Decisions
- `id`, `submission_id` (FK → Submissions), `editor_id` (FK → Users), `decision` (accept | reject), `notes` (optional editor notes), `created_at`

### Publications
- `id`, `submission_id` (FK → Submissions), `doi`, `published_at`

### CMS Pages
- `id`, `slug`, `title`, `content` (HTML from WYSIWYG), `page_type` (about | editorial_board | guidelines | news), `published`, `created_at`, `updated_at`

### Notifications
- `id`, `user_id` (FK → Users), `type`, `message`, `link`, `read`, `created_at`

### Journal Settings
- Key-value store or single-row config table for journal-wide settings.

---

## Non-Functional Requirements

### Security
- Row-level security (RLS) via Supabase for data isolation.
- File access control: manuscript PDFs accessible only to the submitting author, assigned reviewers, and editors — until published, then publicly accessible.
- Double-blind enforcement: reviewer-facing views must not expose author identity when journal is in double-blind mode.

### Performance
- Full-text search should return results within ~1 second for a corpus of up to ~10,000 papers.
- PDF text extraction runs as a background job (not blocking submission).

### Scale Expectations (MVP)
- Hundreds of submissions per year, not thousands.
- Dozens of active reviewers and editors, not hundreds.
- Postgres FTS is more than adequate at this scale.

---

## Out of Scope (v1)

- Revision rounds / revise-and-resubmit workflow
- Automated reviewer suggestion
- Plagiarism detection (iThenticate integration)
- Citation metadata (Highwire Press tags, Dublin Core, JATS XML)
- Multi-journal support
- Subscription/paywall
- Co-author account linking
- Real-time notifications (WebSockets/SSE)
- Advanced analytics and charting
- LaTeX/Word manuscript support
- Structured review forms with scoring

---

## Future Considerations (v2+)

- Revision workflow (revise & resubmit with multiple review rounds)
- Plagiarism detection integration
- Google Scholar / Semantic Scholar metadata tags for discoverability
- Multi-journal tenancy
- Reviewer suggestion engine (keyword/expertise matching)
- Structured review forms alongside freeform text
- Real-time notification updates
- Co-author account linking and shared submission visibility
- JATS XML generation for interoperability
