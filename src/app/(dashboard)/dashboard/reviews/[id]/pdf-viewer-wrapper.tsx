"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PdfViewer } from "@/components/pdf-viewer";

export function PdfViewerWrapper({ filePath }: { filePath: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function getUrl() {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("manuscripts")
        .createSignedUrl(filePath, 3600); // 1 hour

      if (error) {
        setError("Failed to load manuscript");
        return;
      }
      setUrl(data.signedUrl);
    }
    getUrl();
  }, [filePath]);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!url) {
    return <p className="text-sm text-muted-foreground">Loading manuscript...</p>;
  }

  return <PdfViewer url={url} />;
}
