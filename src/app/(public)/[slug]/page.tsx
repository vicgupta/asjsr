import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";

// Reserve known routes from being treated as CMS slugs
const reservedSlugs = ["archive", "search", "login", "register", "forgot-password", "dashboard"];

export default async function CmsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (reservedSlugs.includes(slug)) {
    notFound();
  }

  const supabase = await createClient();

  const { data: page } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!page) notFound();

  const cleanHtml = sanitizeHtml(page.content_html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "width", "height"],
      a: ["href", "target", "rel"],
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    </div>
  );
}
