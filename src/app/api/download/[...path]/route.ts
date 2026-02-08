import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = path.join("/");

  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("manuscripts")
    .download(filePath);

  if (error) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const fileName = filePath.split("/").pop() || "manuscript.pdf";

  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
