"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withdrawSubmission } from "@/lib/actions/submissions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function WithdrawButton({ submissionId }: { submissionId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleWithdraw() {
    if (!confirm("Are you sure you want to withdraw this submission?")) return;

    setLoading(true);
    const result = await withdrawSubmission(submissionId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Submission withdrawn");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button
      variant="destructive"
      onClick={handleWithdraw}
      disabled={loading}
    >
      {loading ? "Withdrawing..." : "Withdraw Submission"}
    </Button>
  );
}
