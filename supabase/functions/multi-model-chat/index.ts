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
  "anthropic/claude-4-sonnet": { input: 0.003, output: 0.015 },
  "anthropic/claude-4-haiku": { input: 0.0008, output: 0.004 },
  "deepseek/deepseek-v3": { input: 0.00027, output: 0.0011 },
  "deepseek/deepseek-r1": { input: 0.00055, output: 0.0022 },
  "mistral/mistral-large": { input: 0.002, output: 0.006 },
  "mistral/codestral": { input: 0.0003, output: 0.0009 },
  "kimi/moonshot-v1": { input: 0.001, output: 0.002 },
};

const RATE_LIMIT = 30;

const VISION_MODELS = ["google/gemini-2.5-pro", "openai/gpt-5"];

function getServiceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
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

async function getUserMemories(sb: any, userId: string): Promise<string> {
  // Check if memory is enabled for this user
  const { data: prefs } = await sb.from("user_preferences").select("memory_enabled").eq("user_id", userId).maybeSingle();
  if (prefs && prefs.memory_enabled === false) return "";

  const { data } = await sb.from("user_memories").select("fact").eq("user_id", userId).limit(20);
  if (!data || data.length === 0) return "";
  return "\n\n[User Memory Context]:\n" + data.map((m: any) => `- ${m.fact}`).join("\n");
}

async function getCustomSystemPrompt(sb: any, userId: string, projectId?: string): Promise<string> {
  let prompt = "";
  const { data: profile } = await sb.from("profiles").select("custom_system_prompt").eq("user_id", userId).single();
  if (profile?.custom_system_prompt) prompt += profile.custom_system_prompt;
  if (projectId) {
    const { data: project } = await sb.from("projects").select("custom_instruction").eq("id", projectId).single();
    if (project?.custom_instruction) prompt += (prompt ? "\n\n" : "") + project.custom_instruction;
  }
  return prompt;
}

async function extractAndStoreMemories(sb: any, userId: string, chatId: string | null, content: string) {
  // Simple heuristic: extract "remember" or key fact patterns
  const patterns = [
    /(?:remember|note|keep in mind)[:\s]+(.+?)(?:\.|$)/gi,
    /(?:my name is|i am|i'm|i prefer|i use|i work (?:at|with|on)|i live in)\s+(.+?)(?:\.|,|$)/gi,
  ];
  const facts: string[] = [];
  for (const p of patterns) {
    let match;
    while ((match = p.exec(content)) !== null) {
      if (match[1]?.trim().length > 3 && match[1].trim().length < 200) {
        facts.push(match[1].trim());
      }
    }
  }
  if (facts.length > 0) {
    const rows = facts.map(f => ({ user_id: userId, fact: f, source_chat_id: chatId || null }));
    await sb.from("user_memories").insert(rows);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const start = Date.now();
  const userId = getUserId(req);

  try {
    const { prompt, model, projectId, chatId, messageId, max_tokens, request_type, stream, image_base64, image_mime_type } = await req.json();
    const sb = getServiceClient();
    const reqType = request_type || "model_compare";
    const shouldStream = stream === true;

    // Check ban/suspension
    if (userId) {
      const { data: profile } = await sb.from("profiles").select("status, suspended_until").eq("user_id", userId).single();
      if (profile?.status === "banned") {
        return new Response(JSON.stringify({ error: "Your account has been banned", code: "BANNED" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (profile?.status === "suspended") {
        const until = profile.suspended_until ? new Date(profile.suspended_until) : null;
        if (until && until > new Date()) {
          return new Response(JSON.stringify({ error: "Your account is suspended", code: "SUSPENDED" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }

    const modelId = model || "google/gemini-3-flash-preview";

    // Custom model routing
    const { data: modelConfig } = await sb.from("model_configs").select("*").eq("model_name", modelId).eq("enabled", true).maybeSingle();
    if (modelConfig?.is_custom && modelConfig?.provider_url) {
      const apiKey = modelConfig.api_key_env ? Deno.env.get(modelConfig.api_key_env) : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
      const requestBody = JSON.stringify({ model: modelId, messages: [{ role: "system", content: "You are a helpful AI assistant." }, { role: "user", content: prompt }], stream: false, ...(max_tokens ? { max_tokens } : {}) });
      const response = await fetch(modelConfig.provider_url, { method: "POST", headers, body: requestBody });
      const latency = Date.now() - start;
      if (!response.ok) {
        if (userId) await sb.from("usage_events").insert({ user_id: userId, project_id: projectId || null, chat_id: chatId || null, message_id: messageId || null, provider: modelConfig.provider_name, model: modelId, request_type: reqType, latency_ms: latency, status: "error", error_code: String(response.status) });
        return new Response(JSON.stringify({ error: "Custom model error" }), { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || JSON.stringify(data);
      const usage = data.usage || {};
      if (userId) await sb.from("usage_events").insert({ user_id: userId, project_id: projectId || null, chat_id: chatId || null, message_id: messageId || null, provider: modelConfig.provider_name, model: modelId, request_type: reqType, input_tokens: usage.prompt_tokens || 0, output_tokens: usage.completion_tokens || 0, estimated_cost: 0, latency_ms: latency, status: "success" });
      return new Response(JSON.stringify({ content, usage: { input_tokens: usage.prompt_tokens || 0, output_tokens: usage.completion_tokens || 0, estimated_cost: 0 } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Standard Lovable AI gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Rate limit + monthly cap + message limit
    if (userId) {
      // Get user's plan features
      const { data: profile } = await sb.from("profiles").select("plan").eq("user_id", userId).single();
      const userPlan = profile?.plan || "free";
      
      const { data: planData } = await sb.from("subscription_plans").select("features").eq("plan_name", userPlan).single();
      const features = planData?.features || {};
      
      // Check message limit per day (count distinct message_ids, not per-model events)
      const messagesPerDay = features.messages_per_day || 5;
      if (messagesPerDay > 0) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: dayEvents } = await sb.from("usage_events").select("message_id").eq("user_id", userId).not("message_id", "is", null).gte("created_at", oneDayAgo);
        const uniqueMessages = new Set((dayEvents || []).map((e: any) => e.message_id));
        if (uniqueMessages.size >= messagesPerDay) {
          return new Response(JSON.stringify({ error: "Daily message limit reached", code: "MESSAGE_LIMIT" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
      
      // Check monthly token limit (for pro users)
      const maxTokensPerMonth = features.max_tokens_per_month;
      if (maxTokensPerMonth) {
        const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
        const { data: tokenData } = await sb.from("usage_events").select("input_tokens, output_tokens").eq("user_id", userId).gte("created_at", startOfMonth.toISOString());
        const totalTokens = (tokenData || []).reduce((s, r) => s + (Number(r.input_tokens) || 0) + (Number(r.output_tokens) || 0), 0);
        if (totalTokens >= maxTokensPerMonth) {
          return new Response(JSON.stringify({ error: "Monthly token limit reached", code: "TOKEN_LIMIT" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
      
      // Rate limit check
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await sb.from("usage_events").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", oneHourAgo);
      if ((count || 0) >= RATE_LIMIT) {
        return new Response(JSON.stringify({ error: "Too many requests, please wait", code: "RATE_LIMIT" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Build system prompt with memory + custom instructions
    let systemPrompt = "You are a helpful AI assistant. Provide clear, well-structured, and thorough answers.";
    if (userId) {
      const customPrompt = await getCustomSystemPrompt(sb, userId, projectId);
      if (customPrompt) systemPrompt = customPrompt + "\n\n" + systemPrompt;
      const memoryContext = await getUserMemories(sb, userId);
      if (memoryContext) systemPrompt += memoryContext;
    }

    // Build user message content (text + optional image)
    let userContent: any = prompt;
    if (image_base64 && image_mime_type && VISION_MODELS.includes(modelId)) {
      userContent = [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: `data:${image_mime_type};base64,${image_base64}` } },
      ];
    }

    const requestBody = {
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      stream: shouldStream,
      ...(max_tokens ? { max_tokens } : {}),
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const status = response.status;
      const errorMsg = status === 429 ? "Rate limit exceeded. Please try again later." : status === 402 ? "Usage limit reached. Please add credits." : "AI model error";
      if (userId) await sb.from("usage_events").insert({ user_id: userId, project_id: projectId || null, chat_id: chatId || null, message_id: messageId || null, provider: modelId.split("/")[0], model: modelId, request_type: reqType, latency_ms: Date.now() - start, status: "error", error_code: String(status) });
      return new Response(JSON.stringify({ error: errorMsg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Streaming response
    if (shouldStream) {
      const streamBody = response.body;
      if (!streamBody) throw new Error("No stream body");

      // Insert a placeholder usage event immediately so it's always recorded
      const estimatedInputTokens = Math.ceil(prompt.length / 4);
      if (userId) {
        await sb.from("usage_events").insert({
          user_id: userId, project_id: projectId || null, chat_id: chatId || null,
          message_id: messageId || null, provider: modelId.split("/")[0], model: modelId,
          request_type: reqType, input_tokens: estimatedInputTokens, output_tokens: 0,
          estimated_cost: 0, latency_ms: 0, status: "success"
        });
      }

      // Track content for memory extraction
      let fullContent = "";
      const decoder = new TextDecoder();

      const transform = new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(chunk);
          const text = decoder.decode(chunk, { stream: true });
          for (const line of text.split("\n")) {
            if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) fullContent += delta;
            } catch {}
          }
        },
        flush() {
          // Extract memories after stream completes (fire and forget)
          if (userId) {
            extractAndStoreMemories(sb, userId, chatId, prompt).catch(() => {});
          }
        }
      });

      const outputStream = streamBody.pipeThrough(transform);
      return new Response(outputStream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    // Non-streaming response
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No response generated";
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const rates = COST_PER_1K[modelId] || { input: 0.001, output: 0.002 };
    const estCost = (inputTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output;
    const latency = Date.now() - start;

    if (userId) {
      await sb.from("usage_events").insert({ user_id: userId, project_id: projectId || null, chat_id: chatId || null, message_id: messageId || null, provider: modelId.split("/")[0], model: modelId, request_type: reqType, input_tokens: inputTokens, output_tokens: outputTokens, estimated_cost: estCost, latency_ms: latency, status: "success" });
      extractAndStoreMemories(sb, userId, chatId, prompt).catch(() => {});
      return new Response(JSON.stringify({ content, usage: { input_tokens: inputTokens, output_tokens: outputTokens, estimated_cost: estCost } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("multi-model-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
