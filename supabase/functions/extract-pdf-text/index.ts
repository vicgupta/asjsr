import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";

Deno.serve(async (req) => {
  try {
    const { submission_id, file_path } = await req.json();

    if (!submission_id || !file_path) {
      return new Response(
        JSON.stringify({ error: "Missing submission_id or file_path" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("manuscripts")
      .download(file_path);

    if (downloadError) {
      return new Response(
        JSON.stringify({ error: `Download failed: ${downloadError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract text from PDF
    const buffer = await fileData.arrayBuffer();
    const pdf = await getDocumentProxy(new Uint8Array(buffer));

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(" ");
      text += pageText + "\n";
    }

    // Update submission with extracted text
    const { error: updateError } = await supabase
      .from("submissions")
      .update({ extracted_text: text.trim() })
      .eq("id", submission_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: `Update failed: ${updateError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, text_length: text.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
