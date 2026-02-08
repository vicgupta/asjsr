"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createSubmission, updateSubmissionFile } from "@/lib/actions/submissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { CoAuthor } from "@/types/database";

export default function NewSubmissionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addKeyword(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const kw = keywordInput.trim().replace(/,/g, "");
      if (kw && !keywords.includes(kw)) {
        setKeywords([...keywords, kw]);
      }
      setKeywordInput("");
    }
  }

  function removeKeyword(kw: string) {
    setKeywords(keywords.filter((k) => k !== kw));
  }

  function addCoAuthor() {
    setCoAuthors([...coAuthors, { name: "", affiliation: "" }]);
  }

  function updateCoAuthor(index: number, field: keyof CoAuthor, value: string) {
    const updated = [...coAuthors];
    updated[index] = { ...updated[index], [field]: value };
    setCoAuthors(updated);
  }

  function removeCoAuthor(index: number) {
    setCoAuthors(coAuthors.filter((_, i) => i !== index));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      toast.error("Only PDF files are accepted");
      return;
    }
    if (selected.size > 100 * 1024 * 1024) {
      toast.error("File must be under 100MB");
      return;
    }
    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Please upload a PDF manuscript");
      return;
    }

    setSubmitting(true);

    const result = await createSubmission({
      title,
      abstract,
      keywords,
      co_authors: coAuthors.filter((ca) => ca.name.trim()),
    });

    if (result.error) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }

    const submissionId = result.id!;

    // Upload file to Supabase Storage
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Not authenticated");
      setSubmitting(false);
      return;
    }

    const filePath = `${user.id}/${submissionId}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("manuscripts")
      .upload(filePath, file);

    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`);
      setSubmitting(false);
      return;
    }

    const updateResult = await updateSubmissionFile(submissionId, filePath);
    if (updateResult.error) {
      toast.error(updateResult.error);
      setSubmitting(false);
      return;
    }

    toast.success("Submission created successfully");
    router.push("/dashboard/submissions");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">New Submission</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manuscript Details</CardTitle>
            <CardDescription>
              Provide information about your manuscript
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Manuscript title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="abstract">Abstract</Label>
              <Textarea
                id="abstract"
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Write your abstract..."
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={addKeyword}
                placeholder="Type a keyword and press Enter"
              />
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {keywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeKeyword(kw)}
                    >
                      {kw} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Co-Authors</CardTitle>
            <CardDescription>Add co-authors if applicable</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {coAuthors.map((ca, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label>Name</Label>
                  <Input
                    value={ca.name}
                    onChange={(e) => updateCoAuthor(i, "name", e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label>Affiliation</Label>
                  <Input
                    value={ca.affiliation}
                    onChange={(e) =>
                      updateCoAuthor(i, "affiliation", e.target.value)
                    }
                    placeholder="Institution"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCoAuthor(i)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addCoAuthor}>
              Add Co-Author
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manuscript File</CardTitle>
            <CardDescription>Upload your manuscript as PDF (max 100MB)</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
            />
            {file && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
              </p>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Submitting..." : "Submit Manuscript"}
        </Button>
      </form>
    </div>
  );
}
