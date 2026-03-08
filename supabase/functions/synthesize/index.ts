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
    const { prompt, responses, projectId, chatId, messageId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const model = "google/gemini-2.5-flash";

    const formattedResponses = responses
      .map((r: { model: string; content: string }) => `--- Response from ${r.model} ---\n${r.content}`)
      .join("\n\n");

    const systemPrompt = `You are a synthesis expert. You receive the same prompt sent to multiple AI models along with their responses. Your job is to create ONE best final answer by:

1. Identifying the strongest and most accurate parts of each response
2. Combining complementary information
3. Resolving any contradictions by choosing the most accurate version
4. Producing a well-structured, comprehensive, and clear final answer
5. Do NOT reference the individual models or say "Model X said..." — just give the best answer

Return ONLY the synthesized answer.`;

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
          { role: "user", content: `Original prompt: ${prompt}\n\nModel responses:\n\n${formattedResponses}` },
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
          request_type: "synthesis", latency_ms: latency, status: "error", error_code: String(status),
        });
      }
      const errorMsg = status === 429 ? "Rate limit exceeded. Please try again later."
        : status === 402 ? "Usage limit reached. Please add credits." : "Synthesis failed";
      return new Response(JSON.stringify({ error: errorMsg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Synthesis failed";
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const estCost = (inputTokens / 1000) * 0.00015 + (outputTokens / 1000) * 0.0006;

    if (userId) {
      const sb = getServiceClient();
      await sb.from("usage_events").insert({
        user_id: userId, project_id: projectId || null, chat_id: chatId || null,
        message_id: messageId || null, provider: "google", model,
        request_type: "synthesis", input_tokens: inputTokens, output_tokens: outputTokens,
        estimated_cost: estCost, latency_ms: latency, status: "success",
      });
    }

    return new Response(JSON.stringify({ content, usage: { input_tokens: inputTokens, output_tokens: outputTokens, estimated_cost: estCost } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("synthesize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
