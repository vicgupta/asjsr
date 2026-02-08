"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { assignReviewer } from "@/lib/actions/reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  submissionId: string;
  authorId: string;
  defaultDeadlineDays: number;
}

interface UserResult {
  id: string;
  full_name: string;
  email: string;
}

export function AssignReviewerForm({
  submissionId,
  authorId,
  defaultDeadlineDays,
}: Props) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [deadlineDays, setDeadlineDays] = useState(defaultDeadlineDays);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  async function handleSearch() {
    if (search.length < 2) return;
    setSearching(true);

    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      .neq("id", authorId)
      .limit(10);

    setResults((data as UserResult[]) || []);
    setSearching(false);
  }

  async function handleAssign() {
    if (!selectedUser) return;
    setLoading(true);

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + deadlineDays);

    const result = await assignReviewer({
      submissionId,
      reviewerId: selectedUser.id,
      deadline: deadline.toISOString(),
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Reviewer ${selectedUser.full_name || selectedUser.email} assigned`);
      setSelectedUser(null);
      setSearch("");
      setResults([]);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="border-t pt-4 space-y-3">
      <p className="text-sm font-medium">Assign Reviewer</p>

      <div className="flex gap-2">
        <Input
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleSearch}
          disabled={searching}
        >
          {searching ? "..." : "Search"}
        </Button>
      </div>

      {results.length > 0 && !selectedUser && (
        <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex justify-between"
              onClick={() => {
                setSelectedUser(u);
                setResults([]);
              }}
            >
              <span>{u.full_name || "No name"}</span>
              <span className="text-muted-foreground">{u.email}</span>
            </button>
          ))}
        </div>
      )}

      {selectedUser && (
        <div className="space-y-3 bg-muted/50 p-3 rounded-md">
          <p className="text-sm">
            Selected: <strong>{selectedUser.full_name || selectedUser.email}</strong>
          </p>
          <div className="flex items-center gap-2">
            <Label htmlFor="deadline" className="text-sm whitespace-nowrap">
              Deadline (days):
            </Label>
            <Input
              id="deadline"
              type="number"
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(parseInt(e.target.value) || 21)}
              className="w-20"
              min={1}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAssign} disabled={loading} size="sm">
              {loading ? "Assigning..." : "Assign"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUser(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
