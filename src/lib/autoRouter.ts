/**
 * Auto-routing logic for Super Fiesta mode.
 * Classifies the prompt and picks the best model.
 */

const CODE_KEYWORDS = /\b(code|function|class|component|debug|error|bug|typescript|javascript|python|sql|api|regex|algorithm|refactor|deploy)\b/i;
const RESEARCH_KEYWORDS = /\b(research|explain|compare|analyze|history|science|philosophy|economics|study|review|summarize|academic)\b/i;
const CREATIVE_KEYWORDS = /\b(write|story|poem|essay|blog|article|creative|draft|letter|email|content|copy|script)\b/i;
const SIMPLE_KEYWORDS = /\b(hi|hello|hey|thanks|ok|yes|no|what time|translate|define|meaning)\b/i;

export type QueryCategory = "code" | "research" | "creative" | "simple" | "general";

export function classifyQuery(prompt: string): QueryCategory {
  const trimmed = prompt.trim();
  
  // Short prompts are simple
  if (trimmed.length < 20 && SIMPLE_KEYWORDS.test(trimmed)) return "simple";
  
  if (CODE_KEYWORDS.test(trimmed)) return "code";
  if (RESEARCH_KEYWORDS.test(trimmed)) return "research";
  if (CREATIVE_KEYWORDS.test(trimmed)) return "creative";
  if (trimmed.length < 40) return "simple";
  
  return "general";
}

const ROUTE_MAP: Record<QueryCategory, string> = {
  code: "google/gemini-2.5-pro",
  research: "google/gemini-2.5-pro",
  creative: "openai/gpt-5-mini",
  simple: "google/gemini-3-flash-preview",
  general: "google/gemini-3-flash-preview",
};

export function pickBestModel(prompt: string, enabledModels: string[]): string {
  const category = classifyQuery(prompt);
  const preferred = ROUTE_MAP[category];
  
  // Use preferred if enabled, otherwise fall back
  if (enabledModels.includes(preferred)) return preferred;
  
  // Fallback chain
  const fallbacks = ["google/gemini-3-flash-preview", "google/gemini-2.5-flash", "openai/gpt-5-mini"];
  for (const fb of fallbacks) {
    if (enabledModels.includes(fb)) return fb;
  }
  
  return enabledModels[0] || "google/gemini-3-flash-preview";
}
