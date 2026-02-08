"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateCmsPage, deleteCmsPage } from "@/lib/actions/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TiptapEditor } from "@/components/tiptap-editor";
import { toast } from "sonner";
import type { CmsPageType, Json } from "@/types/database";
import type { JSONContent } from "@tiptap/react";
import { use } from "react";

export default function EditCmsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [pageType, setPageType] = useState<CmsPageType>("static");
  const [contentJson, setContentJson] = useState<JSONContent>({});
  const [contentHtml, setContentHtml] = useState("");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: page } = await supabase
        .from("cms_pages")
        .select("*")
        .eq("id", id)
        .single();

      if (page) {
        setTitle(page.title);
        setSlug(page.slug);
        setPageType(page.page_type);
        setContentJson((page.content_json as JSONContent) || {});
        setContentHtml(page.content_html);
        setPublished(page.published);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = await updateCmsPage(id, {
      slug,
      title,
      pageType,
      contentJson: contentJson as Json,
      contentHtml,
      published,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Page updated");
      router.push("/dashboard/editor/cms");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this page? This cannot be undone.")) return;

    const result = await deleteCmsPage(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Page deleted");
      router.push("/dashboard/editor/cms");
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Page</h1>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          Delete Page
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Page Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Page Type</Label>
                <Select
                  value={pageType}
                  onValueChange={(v) => setPageType(v as CmsPageType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                  />
                  <Label htmlFor="published">Published</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <TiptapEditor
              content={contentJson}
              onChange={(json, html) => {
                setContentJson(json);
                setContentHtml(html);
              }}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
