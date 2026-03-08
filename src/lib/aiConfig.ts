export type CostMode = "low_cost" | "balanced" | "premium";

export interface CostModeConfig {
  label: string;
  enabledModels: string[];
  maxOutputTokens: number;
  timeoutMs: number;
  synthesisModel: string;
  enhanceModel: string;
  premiumAllowed: boolean;
}

const ALL_MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
  "anthropic/claude-4-sonnet",
  "anthropic/claude-4-haiku",
  "deepseek/deepseek-v3",
  "deepseek/deepseek-r1",
  "mistral/mistral-large",
  "mistral/codestral",
  "kimi/moonshot-v1",
];

export const AI_CONFIG = {
  costModes: {
    low_cost: {
      label: "Low Cost",
      enabledModels: ["google/gemini-2.5-flash", "openai/gpt-5-nano"],
      maxOutputTokens: 2048,
      timeoutMs: 30000,
      synthesisModel: "google/gemini-2.5-flash",
      enhanceModel: "google/gemini-2.5-flash",
      premiumAllowed: false,
    },
    balanced: {
      label: "Balanced",
      enabledModels: ["google/gemini-3-flash-preview", "google/gemini-2.5-flash", "google/gemini-2.5-pro", "openai/gpt-5-mini", "openai/gpt-5-nano"],
      maxOutputTokens: 4096,
      timeoutMs: 60000,
      synthesisModel: "google/gemini-2.5-flash",
      enhanceModel: "google/gemini-2.5-flash",
      premiumAllowed: false,
    },
    premium: {
      label: "Premium",
      enabledModels: ALL_MODELS,
      maxOutputTokens: 8192,
      timeoutMs: 90000,
      synthesisModel: "openai/gpt-5",
      enhanceModel: "google/gemini-2.5-flash",
      premiumAllowed: true,
    },
  } satisfies Record<CostMode, CostModeConfig>,

  limits: {
    maxModelsPerRequest: 6,
    maxPromptLength: 10000,
    maxFileContextLength: 50000,
    maxSynthesisInputLength: 30000,
    maxFileSizeMb: 10,
    softCapUsd: 5.0,
    hardCapUsd: 10.0,
    rateLimit: { maxRequests: 30, windowMinutes: 60 },
    maxRetries: 1,
  },

  costPer1kTokens: {
    "google/gemini-3-flash-preview": { input: 0.00015, output: 0.0006 },
    "google/gemini-2.5-flash": { input: 0.00015, output: 0.0006 },
    "google/gemini-2.5-pro": { input: 0.00125, output: 0.005 },
    "openai/gpt-5": { input: 0.005, output: 0.015 },
    "openai/gpt-5-mini": { input: 0.0004, output: 0.0016 },
    "openai/gpt-5-nano": { input: 0.0001, output: 0.0004 },
  } as Record<string, { input: number; output: number }>,

  allModels: ALL_MODELS,

  modelLabels: {
    "google/gemini-3-flash-preview": "Gemini 3 Flash",
    "google/gemini-2.5-flash": "Gemini 2.5 Flash",
    "google/gemini-2.5-pro": "Gemini 2.5 Pro",
    "openai/gpt-5": "GPT-5",
    "openai/gpt-5-mini": "GPT-5 Mini",
    "openai/gpt-5-nano": "GPT-5 Nano",
  } as Record<string, string>,

  modelShortLabels: {
    "google/gemini-3-flash-preview": "G3F",
    "google/gemini-2.5-flash": "G2.5F",
    "google/gemini-2.5-pro": "G2.5P",
    "openai/gpt-5": "GPT5",
    "openai/gpt-5-mini": "GPT5m",
    "openai/gpt-5-nano": "GPT5n",
  } as Record<string, string>,
} as const;

export function getProvider(model: string): string {
  return model.split("/")[0] || "unknown";
}

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = AI_CONFIG.costPer1kTokens[model];
  if (!rates) return 0;
  return (inputTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output;
}
