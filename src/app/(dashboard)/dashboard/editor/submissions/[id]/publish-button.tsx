"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { publishPaper } from "@/lib/actions/publications";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PublishButton({ submissionId }: { submissionId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handlePublish() {
    if (!confirm("Publish this paper? This will mint a DOI and make it publicly available."))
      return;

    setLoading(true);
    const result = await publishPaper(submissionId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Published with DOI: ${result.doi}`);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button onClick={handlePublish} disabled={loading}>
      {loading ? "Publishing..." : "Publish Paper"}
    </Button>
  );
}
