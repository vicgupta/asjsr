"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function MarkReadButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleMarkAllRead() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      toast.error("Failed to mark as read");
    } else {
      toast.success("All notifications marked as read");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkAllRead}
      disabled={loading}
    >
      {loading ? "Marking..." : "Mark All Read"}
    </Button>
  );
}
