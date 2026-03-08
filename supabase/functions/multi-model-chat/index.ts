import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COST_PER_1K: Record<string, { input: number; output: number }> = {
  "google/gemini-3-flash-preview": { input: 0.00015, output: 0.0006 },
  "google/gemini-2.5-flash": { input: 0.00015, output: 0.0006 },
  "google/gemini-2.5-pro": { input: 0.00125, output: 0.005 },
  "openai/gpt-5": { input: 0.005, output: 0.015 },
  "openai/gpt-5-mini": { input: 0.0004, output: 0.0016 },
  "openai/gpt-5-nano": { input: 0.0001, output: 0.0004 },
};

const HARD_CAP = 10.0;
const SOFT_CAP = 5.0;
const RATE_LIMIT = 30;

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getUserId(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || null;
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const start = Date.now();
  const userId = getUserId(req);

  try {
    const { prompt, model, projectId, chatId, messageId, max_tokens, request_type } = await req.json();
    const sb = getServiceClient();
    const reqType = request_type || "model_compare";

    // Check if user is banned/suspended + get custom caps
    let userSoftCap = SOFT_CAP;
    let userHardCap = HARD_CAP;
    if (userId) {
      const { data: profile } = await sb.from("profiles").select("status, suspended_until, custom_soft_cap, custom_hard_cap").eq("user_id", userId).single();
      if (profile?.status === "banned") {
        return new Response(JSON.stringify({ error: "Your account has been banned", code: "BANNED" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (profile?.status === "suspended") {
        const until = profile.suspended_until ? new Date(profile.suspended_until) : null;
        if (until && until > new Date()) {
          return new Response(JSON.stringify({ error: "Your account is suspended", code: "SUSPENDED" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      if (profile?.custom_soft_cap != null) userSoftCap = Number(profile.custom_soft_cap);
      if (profile?.custom_hard_cap != null) userHardCap = Number(profile.custom_hard_cap);
    }

    // Check if model is custom and route accordingly
    const modelId = model || "google/gemini-3-flash-preview";
    const { data: modelConfig } = await sb.from("model_configs").select("*").eq("model_name", modelId).eq("enabled", true).maybeSingle();

    if (modelConfig?.is_custom && modelConfig?.provider_url) {
      // Route to custom endpoint
      const apiKey = modelConfig.api_key_env ? Deno.env.get(modelConfig.api_key_env) : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

      let requestBody: string;
      if (modelConfig.request_format) {
        requestBody = JSON.stringify(modelConfig.request_format)
          .replace(/\{\{model\}\}/g, modelId)
          .replace(/\{\{prompt\}\}/g, prompt);
      } else {
        requestBody = JSON.stringify({
          model: modelId,
          messages: [
            { role: "system", content: "You are a helpful AI assistant." },
            { role: "user", content: prompt },
          ],
          stream: false,
          ...(max_tokens ? { max_tokens } : {}),
        });
      }

      const response = await fetch(modelConfig.provider_url, {
        method: "POST", headers, body: requestBody,
      });
      const latency = Date.now() - start;

      if (!response.ok) {
        if (userId) {
          await sb.from("usage_events").insert({
            user_id: userId, project_id: projectId || null, chat_id: chatId || null,
            message_id: messageId || null, provider: modelConfig.provider_name,
            model: modelId, request_type: reqType, latency_ms: latency, status: "error",
            error_code: String(response.status),
          });
        }
        return new Response(JSON.stringify({ error: "Custom model error" }), {
          status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || JSON.stringify(data);
      const usage = data.usage || {};

      if (userId) {
        await sb.from("usage_events").insert({
          user_id: userId, project_id: projectId || null, chat_id: chatId || null,
          message_id: messageId || null, provider: modelConfig.provider_name,
          model: modelId, request_type: reqType,
          input_tokens: usage.prompt_tokens || 0, output_tokens: usage.completion_tokens || 0,
          estimated_cost: 0, latency_ms: latency, status: "success",
        });
      }

      return new Response(JSON.stringify({ content, usage: { input_tokens: usage.prompt_tokens || 0, output_tokens: usage.completion_tokens || 0, estimated_cost: 0 } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Standard Lovable AI gateway flow
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Rate limit check
    if (userId) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await sb.from("usage_events").select("id", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", oneHourAgo);
      if ((count || 0) >= RATE_LIMIT) {
        return new Response(JSON.stringify({ error: "Too many requests, please wait", code: "RATE_LIMIT" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Monthly cap check
      const startOfMonth = new Date();
      startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      const { data: costData } = await sb.from("usage_events").select("estimated_cost")
        .eq("user_id", userId).gte("created_at", startOfMonth.toISOString());
      const monthlyCost = (costData || []).reduce((s, r) => s + (Number(r.estimated_cost) || 0), 0);
      if (monthlyCost >= userHardCap) {
        return new Response(JSON.stringify({ error: "Monthly usage limit reached", code: "HARD_CAP" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: "You are a helpful AI assistant. Provide clear, well-structured, and thorough answers." },
          { role: "user", content: prompt },
        ],
        stream: false,
        ...(max_tokens ? { max_tokens } : {}),
      }),
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      const status = response.status;
      const errorMsg = status === 429 ? "Rate limit exceeded. Please try again later."
        : status === 402 ? "Usage limit reached. Please add credits."
        : "AI model error";

      if (userId) {
        await sb.from("usage_events").insert({
          user_id: userId, project_id: projectId || null, chat_id: chatId || null,
          message_id: messageId || null, provider: modelId.split("/")[0],
          model: modelId, request_type: reqType,
          latency_ms: latency, status: "error", error_code: String(status),
        });
      }

      return new Response(JSON.stringify({ error: errorMsg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No response generated";
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const rates = COST_PER_1K[modelId] || { input: 0.001, output: 0.002 };
    const estCost = (inputTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output;

    if (userId) {
      const monthlyCostNow = await getMonthlyCost(sb, userId);
      const warning = monthlyCostNow + estCost >= SOFT_CAP ? "Approaching usage limit" : undefined;

      await sb.from("usage_events").insert({
        user_id: userId, project_id: projectId || null, chat_id: chatId || null,
        message_id: messageId || null, provider: modelId.split("/")[0],
        model: modelId, request_type: reqType,
        input_tokens: inputTokens, output_tokens: outputTokens,
        estimated_cost: estCost, latency_ms: latency, status: "success",
      });

      return new Response(JSON.stringify({ content, usage: { input_tokens: inputTokens, output_tokens: outputTokens, estimated_cost: estCost }, warning }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("multi-model-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getMonthlyCost(sb: any, userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
  const { data } = await sb.from("usage_events").select("estimated_cost")
    .eq("user_id", userId).gte("created_at", startOfMonth.toISOString());
  return (data || []).reduce((s: number, r: any) => s + (Number(r.estimated_cost) || 0), 0);
}
