import { Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

export default async function HomePage() {
  let publications: any[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("publications")
      .select(
        "*, submission:submissions(id, title, abstract, keywords, co_authors, submitting_author_id, profiles:submitting_author_id(full_name, affiliation))"
      )
      .eq("retracted", false)
      .order("published_at", { ascending: false })
      .limit(4);
    publications = data ?? [];
  } catch {
    // Supabase not configured — render without publications
  }

  return (
    <div className={instrumentSerif.variable}>
      {/* ── HERO ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0f1e] text-white">
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Ambient gradient glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/[0.04] rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/[0.03] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

        {/* Decorative geometric composition */}
        <div className="absolute top-16 right-[8%] hidden lg:block" aria-hidden="true">
          <div className="relative w-80 h-80">
            <div className="absolute inset-0 rounded-full border border-amber-400/[0.08] animate-fade-in" style={{ animationDelay: "0.6s" }} />
            <div className="absolute top-10 left-10 w-60 h-60 rounded-full border border-amber-400/[0.12] animate-fade-in" style={{ animationDelay: "0.8s" }} />
            <div className="absolute top-24 left-24 w-32 h-32 rounded-full bg-amber-500/[0.04] animate-fade-in" style={{ animationDelay: "1s" }} />
            <div className="absolute top-[52%] left-[20%] w-3 h-3 rounded-full bg-amber-400/30 animate-fade-in" style={{ animationDelay: "1.1s" }} />
            <div className="absolute top-[30%] left-[70%] w-2 h-2 rounded-full bg-amber-400/20 animate-fade-in" style={{ animationDelay: "1.2s" }} />
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#0a0f1e] to-transparent" />

        <div className="relative container mx-auto px-6 py-24 md:py-32 lg:py-40">
          <div className="max-w-3xl">
            <p
              className="text-amber-400/90 text-xs font-medium tracking-[0.25em] uppercase mb-8 animate-fade-in-up"
            >
              Open Access &middot; Peer Reviewed &middot; DOI Registered
            </p>

            <h1
              className="font-serif text-[2.75rem] md:text-6xl lg:text-7xl leading-[1.08] mb-7 animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              Advancing Knowledge,{" "}
              <span className="block mt-1">
                One Paper at a Time
              </span>
            </h1>

            <p
              className="text-slate-400 text-lg md:text-xl max-w-xl mb-10 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              A rigorous, transparent platform for scholarly research.
              Submit manuscripts, engage in peer review, and share your
              findings with the global academic community.
            </p>

            <div
              className="flex flex-wrap gap-4 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <Link href="/archive">
                <Button
                  size="lg"
                  className="bg-amber-600 hover:bg-amber-500 text-white h-12 px-8 text-base cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-amber-600/20"
                >
                  Browse Archive
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-white/[0.06] hover:border-slate-500 h-12 px-8 text-base cursor-pointer transition-all duration-200"
                >
                  Submit a Paper
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST INDICATORS ──────────────────────────── */}
      <section className="border-b bg-white">
        <div className="container mx-auto px-6">
          <div
            className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border animate-fade-in-up"
            style={{ animationDelay: "0.45s" }}
          >
            {[
              {
                title: "Open Access",
                desc: "All papers freely available, no paywalls or APCs",
                mark: "OA",
              },
              {
                title: "Peer Reviewed",
                desc: "Configurable single-blind, double-blind, or open review",
                mark: "PR",
              },
              {
                title: "DOI Registered",
                desc: "Persistent identifiers minted via Crossref on publication",
                mark: "DOI",
              },
              {
                title: "Full-Text Search",
                desc: "Extracted PDF content indexed for comprehensive discovery",
                mark: "FTS",
              },
            ].map((item) => (
              <div key={item.title} className="py-8 md:py-10 px-4 md:px-8 first:pl-0 last:pr-0">
                <span className="inline-block text-[10px] font-mono font-semibold tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded mb-3">
                  {item.mark}
                </span>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LATEST PUBLICATIONS ───────────────────────── */}
      {publications.length > 0 && (
        <section className="bg-stone-50/70 py-20 md:py-28">
          <div className="container mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-medium tracking-[0.2em] uppercase text-amber-600 mb-3">
                  Recent Work
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-slate-900">
                  Latest Publications
                </h2>
              </div>
              <Link
                href="/archive"
                className="hidden md:inline-flex text-sm text-slate-500 hover:text-slate-900 transition-colors underline underline-offset-4 decoration-slate-300 hover:decoration-slate-900"
              >
                View all publications
              </Link>
            </div>

            <div className="space-y-0 divide-y divide-slate-200/80">
              {publications.map((pub) => {
                const submission = pub.submission as any;
                if (!submission) return null;
                const author = submission.profiles as any;

                return (
                  <Link
                    key={pub.id}
                    href={`/archive/${pub.id}`}
                    className="block group py-6 md:py-8 first:pt-0"
                  >
                    <article className="md:flex md:items-start md:gap-8">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-xl md:text-2xl text-slate-900 group-hover:text-amber-700 transition-colors leading-snug mb-2">
                          {submission.title}
                        </h3>
                        <p className="text-sm text-slate-500 mb-3">
                          {author?.full_name || "Unknown Author"}
                          {author?.affiliation && (
                            <span className="text-slate-400">
                              {" "}&mdash; {author.affiliation}
                            </span>
                          )}
                          <span className="text-slate-300 mx-2">|</span>
                          {new Date(pub.published_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          {pub.doi && (
                            <>
                              <span className="text-slate-300 mx-2">|</span>
                              <span className="font-mono text-xs">
                                {pub.doi}
                              </span>
                            </>
                          )}
                        </p>
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                          {submission.abstract}
                        </p>
                        {submission.keywords?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {submission.keywords.slice(0, 5).map((kw: string) => (
                              <Badge
                                key={kw}
                                variant="outline"
                                className="text-[11px] text-slate-500 border-slate-200 bg-white font-normal"
                              >
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="hidden md:flex items-center mt-2 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0">
                        <svg
                          className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                          />
                        </svg>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>

            <div className="mt-10 md:hidden text-center">
              <Link href="/archive">
                <Button variant="outline" className="cursor-pointer">
                  View All Publications
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ──────────────────────────────── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-amber-600 mb-3">
              The Process
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-slate-900">
              From Submission to Publication
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-0 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Submit",
                desc: "Upload your manuscript as a PDF with title, abstract, keywords, and co-author information. Track your submission status throughout the process.",
              },
              {
                step: "02",
                title: "Review",
                desc: "Expert reviewers evaluate your work through a structured peer review process. Configurable blind review modes ensure fairness and rigor.",
              },
              {
                step: "03",
                title: "Publish",
                desc: "Accepted papers go live instantly with a persistent DOI. Full-text indexing makes your research discoverable through our search engine.",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="relative md:px-8 md:border-l md:border-slate-200 md:first:border-l-0"
              >
                <span className="font-mono text-[11px] font-semibold text-amber-500/70 tracking-wider">
                  {item.step}
                </span>
                <h3 className="font-serif text-2xl text-slate-900 mt-2 mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
                {/* connector arrow (desktop) */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 text-slate-300">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR AUTHORS & REVIEWERS ───────────────────── */}
      <section className="py-20 md:py-28 bg-stone-50/70 border-y border-stone-200/60">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 max-w-5xl mx-auto">
            <div className="space-y-5">
              <span className="inline-block text-[10px] font-mono font-semibold tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded">
                FOR AUTHORS
              </span>
              <h3 className="font-serif text-2xl md:text-3xl text-slate-900 leading-snug">
                Share your research with the world
              </h3>
              <p className="text-slate-500 leading-relaxed">
                Submit your manuscript and reach a global audience. Our streamlined
                process takes you from submission to publication with full
                transparency. Track your paper&apos;s status, respond to reviews, and
                receive a DOI upon publication.
              </p>
              <Link href="/register">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white mt-2 cursor-pointer">
                  Create Author Account
                </Button>
              </Link>
            </div>
            <div className="space-y-5">
              <span className="inline-block text-[10px] font-mono font-semibold tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded">
                FOR REVIEWERS
              </span>
              <h3 className="font-serif text-2xl md:text-3xl text-slate-900 leading-snug">
                Contribute your expertise
              </h3>
              <p className="text-slate-500 leading-relaxed">
                Join our community of peer reviewers. Read manuscripts in an
                embedded PDF viewer, submit your expert assessment, and help
                shape the direction of scholarly discourse. Review assignments
                include clear deadlines and editorial guidance.
              </p>
              <Link href="/register">
                <Button variant="outline" className="mt-2 cursor-pointer">
                  Join as Reviewer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0f1e] text-white">
        {/* Dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 left-1/2 w-[500px] h-[300px] bg-amber-500/[0.03] rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />

        <div className="relative container mx-auto px-6 py-20 md:py-28 text-center">
          <h2
            className="font-serif text-3xl md:text-5xl leading-tight mb-5 max-w-2xl mx-auto"
          >
            Shape the Future of Research
          </h2>
          <p className="text-slate-400 text-lg max-w-lg mx-auto mb-10">
            Whether you&apos;re submitting groundbreaking work or reviewing the
            next big discovery, your contribution matters.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-amber-600 hover:bg-amber-500 text-white h-12 px-8 text-base cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-amber-600/20"
              >
                Get Started
              </Button>
            </Link>
            <Link href="/search">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-white/[0.06] hover:border-slate-500 h-12 px-8 text-base cursor-pointer"
              >
                Search Papers
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
