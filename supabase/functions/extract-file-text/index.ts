import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { filePath, fileName, mimeType } = await req.json();

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("project-files")
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    let extractedText = "";

    if (mimeType === "text/plain" || fileName.endsWith(".txt")) {
      extractedText = await fileData.text();
    } else if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
      // For PDF, extract raw text content
      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const textDecoder = new TextDecoder("utf-8", { fatal: false });
      const rawText = textDecoder.decode(bytes);
      
      // Simple PDF text extraction - find text between stream markers
      const textParts: string[] = [];
      const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
      let match;
      while ((match = streamRegex.exec(rawText)) !== null) {
        const content = match[1];
        // Extract readable text characters
        const readable = content.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
        if (readable.length > 10) {
          textParts.push(readable);
        }
      }
      extractedText = textParts.join("\n\n") || "PDF text extraction limited. Upload a TXT version for better results.";
    } else if (fileName.endsWith(".docx")) {
      // DOCX is a ZIP containing XML
      // Simple extraction: read as text and find paragraph content
      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const textDecoder = new TextDecoder("utf-8", { fatal: false });
      const rawText = textDecoder.decode(bytes);
      
      // Extract text between XML tags
      const textParts: string[] = [];
      const tagRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
      let match;
      while ((match = tagRegex.exec(rawText)) !== null) {
        textParts.push(match[1]);
      }
      extractedText = textParts.join(" ") || "DOCX text extraction limited. Upload a TXT version for better results.";
    } else {
      extractedText = "Unsupported file format for text extraction.";
    }

    return new Response(JSON.stringify({ extractedText: extractedText.slice(0, 50000) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-file-text error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
