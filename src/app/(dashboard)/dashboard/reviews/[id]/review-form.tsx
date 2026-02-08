"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitReview } from "@/lib/actions/reviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export function ReviewForm({ reviewId }: { reviewId: string }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please write your review");
      return;
    }

    if (!confirm("Submit your review? This cannot be undone.")) return;

    setLoading(true);
    const result = await submitReview({ reviewId, content });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Review submitted successfully");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Your Review</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="review">Review</Label>
            <Textarea
              id="review"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your review of the manuscript..."
              rows={10}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
