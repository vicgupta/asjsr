"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateJournalSettings } from "@/lib/actions/settings";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import type { ReviewType } from "@/types/database";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [journalName, setJournalName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1e40af");
  const [reviewType, setReviewType] = useState<ReviewType>("double_blind");
  const [deadlineDays, setDeadlineDays] = useState(21);
  const [doiPrefix, setDoiPrefix] = useState("");
  const [crossrefUsername, setCrossrefUsername] = useState("");
  const [crossrefPassword, setCrossrefPassword] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("journal_settings")
        .select("*")
        .single();

      if (data) {
        setJournalName(data.journal_name);
        setPrimaryColor(data.primary_color);
        setReviewType(data.review_type);
        setDeadlineDays(data.default_review_deadline_days);
        setDoiPrefix(data.doi_prefix);
        setCrossrefUsername(data.crossref_username || "");
        setCrossrefPassword(data.crossref_password || "");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = await updateJournalSettings({
      journalName,
      primaryColor,
      reviewType,
      defaultReviewDeadlineDays: deadlineDays,
      doiPrefix,
      crossrefUsername,
      crossrefPassword,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Settings updated");
    }
    setSaving(false);
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading settings...</p>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Journal Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Basic journal configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="journalName">Journal Name</Label>
              <Input
                id="journalName"
                value={journalName}
                onChange={(e) => setJournalName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Review Type</Label>
              <Select
                value={reviewType}
                onValueChange={(v) => setReviewType(v as ReviewType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_blind">Single Blind</SelectItem>
                  <SelectItem value="double_blind">Double Blind</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadlineDays">
                Default Review Deadline (days)
              </Label>
              <Input
                id="deadlineDays"
                type="number"
                value={deadlineDays}
                onChange={(e) =>
                  setDeadlineDays(parseInt(e.target.value) || 21)
                }
                min={1}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DOI / Crossref</CardTitle>
            <CardDescription>
              Configure DOI minting and Crossref deposit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doiPrefix">DOI Prefix</Label>
              <Input
                id="doiPrefix"
                value={doiPrefix}
                onChange={(e) => setDoiPrefix(e.target.value)}
                placeholder="10.XXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crossrefUsername">Crossref Username</Label>
              <Input
                id="crossrefUsername"
                value={crossrefUsername}
                onChange={(e) => setCrossrefUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crossrefPassword">Crossref Password</Label>
              <Input
                id="crossrefPassword"
                type="password"
                value={crossrefPassword}
                onChange={(e) => setCrossrefPassword(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
