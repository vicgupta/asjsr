"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pdfDocRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (cancelled) return;

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setLoading(false);
        renderPage(pdf, 1);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load PDF");
          setLoading(false);
        }
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [url]);

  async function renderPage(pdf: any, pageNum: number) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    const container = canvasContainerRef.current;
    if (!container) return;

    container.innerHTML = "";
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.style.maxWidth = "100%";
    canvas.style.height = "auto";
    container.appendChild(canvas);

    await page.render({ canvasContext: context, viewport }).promise;
  }

  function goToPage(pageNum: number) {
    if (pageNum < 1 || pageNum > numPages || !pdfDocRef.current) return;
    setCurrentPage(pageNum);
    renderPage(pdfDocRef.current, pageNum);
  }

  if (error) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">
          Loading PDF...
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between bg-muted px-4 py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
            >
              Next
            </Button>
          </div>
          <div
            ref={canvasContainerRef}
            className="flex justify-center bg-gray-100 p-4 overflow-auto"
          />
        </>
      )}
    </div>
  );
}
