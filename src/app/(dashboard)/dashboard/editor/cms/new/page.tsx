"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCmsPage } from "@/lib/actions/cms";
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

export default function NewCmsPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [pageType, setPageType] = useState<CmsPageType>("static");
  const [contentJson, setContentJson] = useState<JSONContent>({});
  const [contentHtml, setContentHtml] = useState("");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slug || slug === slugify(title)) {
      setSlug(slugify(value));
    }
  }

  function slugify(str: string) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !slug) {
      toast.error("Title and slug are required");
      return;
    }

    setSaving(true);
    const result = await createCmsPage({
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
      toast.success("Page created");
      router.push("/dashboard/editor/cms");
    }
    setSaving(false);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">New CMS Page</h1>

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
                onChange={(e) => handleTitleChange(e.target.value)}
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
              onChange={(json, html) => {
                setContentJson(json);
                setContentHtml(html);
              }}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Creating..." : "Create Page"}
        </Button>
      </form>
    </div>
  );
}
