"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [bio, setBio] = useState("");
  const [orcidId, setOrcidId] = useState("");
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name);
        setAffiliation(profile.affiliation || "");
        setBio(profile.bio || "");
        setOrcidId(profile.orcid_id || "");
        setEmail(profile.email);
        setRoles(profile.roles);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        affiliation,
        bio,
        orcid_id: orcidId || null,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>
            Email: {email} | Roles:{" "}
            {roles.map((role) => (
              <Badge key={role} variant="secondary" className="mr-1">
                {role}
              </Badge>
            ))}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliation">Affiliation</Label>
              <Input
                id="affiliation"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                placeholder="University or Organization"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orcid">ORCID iD</Label>
              <div className="flex gap-2">
                <Input
                  id="orcid"
                  value={orcidId}
                  onChange={(e) => setOrcidId(e.target.value)}
                  placeholder="0000-0000-0000-0000"
                  className="flex-1"
                />
                {!orcidId && (
                  <a href="/auth/orcid">
                    <Button type="button" variant="outline" size="sm">
                      Link ORCID
                    </Button>
                  </a>
                )}
              </div>
              {orcidId && (
                <a
                  href={`https://orcid.org/${orcidId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View ORCID profile
                </a>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short biography..."
                rows={4}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
