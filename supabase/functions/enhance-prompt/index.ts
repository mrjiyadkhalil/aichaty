import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getServiceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

function getUserId(req: Request): string | null {
  try {
    const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
    return JSON.parse(atob(token.split(".")[1])).sub || null;
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const start = Date.now();
  const userId = getUserId(req);

  try {
    const { prompt, projectInstruction, projectId, chatId, messageId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const model = "google/gemini-2.5-flash";

    const systemPrompt = `You are an expert prompt engineer. Your job is to take a user's draft prompt and improve it to get better AI responses.

Rules:
- Make the prompt clearer, more specific, and more detailed
- Add structure (bullet points, numbered steps) where helpful
- Preserve the user's original intent completely
- Add context clues that help AI models give better answers
- Keep it concise — don't over-pad with unnecessary words
- Return ONLY the improved prompt text, no explanations or meta-commentary

${projectInstruction ? `Project context: ${projectInstruction}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Improve this prompt:\n\n${prompt}` },
        ],
        stream: false,
      }),
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      const status = response.status;
      if (userId) {
        const sb = getServiceClient();
        await sb.from("usage_events").insert({
          user_id: userId, project_id: projectId || null, chat_id: chatId || null,
          message_id: messageId || null, provider: "google", model,
          request_type: "prompt_enhance", latency_ms: latency, status: "error", error_code: String(status),
        });
      }
      const errorMsg = status === 429 ? "Rate limit exceeded. Please try again later."
        : status === 402 ? "Usage limit reached. Please add credits." : "AI model error";
      return new Response(JSON.stringify({ error: errorMsg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const enhanced = data.choices?.[0]?.message?.content || prompt;
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const estCost = (inputTokens / 1000) * 0.00015 + (outputTokens / 1000) * 0.0006;

    if (userId) {
      const sb = getServiceClient();
      await sb.from("usage_events").insert({
        user_id: userId, project_id: projectId || null, chat_id: chatId || null,
        message_id: messageId || null, provider: "google", model,
        request_type: "prompt_enhance", input_tokens: inputTokens, output_tokens: outputTokens,
        estimated_cost: estCost, latency_ms: latency, status: "success",
      });
    }

    return new Response(JSON.stringify({ enhanced, usage: { input_tokens: inputTokens, output_tokens: outputTokens, estimated_cost: estCost } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("enhance-prompt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
