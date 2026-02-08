"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { issueDecision } from "@/lib/actions/decisions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import type { DecisionType } from "@/types/database";

export function DecisionForm({ submissionId }: { submissionId: string }) {
  const [decision, setDecision] = useState<DecisionType | "">("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!decision) {
      toast.error("Please select a decision");
      return;
    }

    setLoading(true);
    const result = await issueDecision({
      submissionId,
      decision,
      notes,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Decision issued successfully");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Decision</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Decision</Label>
            <div className="flex gap-4">
              {(["accept", "revise", "reject"] as DecisionType[]).map((d) => (
                <label key={d} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value={d}
                    checked={decision === d}
                    onChange={() => setDecision(d)}
                    className="accent-primary"
                  />
                  <span className="text-sm capitalize">{d}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for the author..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading || !decision}>
            {loading ? "Submitting..." : "Issue Decision"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
