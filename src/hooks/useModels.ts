import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ModelConfig {
  id: string;
  model_name: string;
  provider_name: string;
  short_label: string | null;
  enabled: boolean;
  premium_only: boolean;
  cost_tier: string;
  max_output_tokens: number;
  timeout_seconds: number;
  is_custom: boolean;
}

let cachedModels: ModelConfig[] | null = null;

export function useModels() {
  const [models, setModels] = useState<ModelConfig[]>(cachedModels || []);
  const [loading, setLoading] = useState(!cachedModels);

  useEffect(() => {
    if (cachedModels) return;
    supabase
      .from("model_configs")
      .select("id, model_name, provider_name, short_label, enabled, premium_only, cost_tier, max_output_tokens, timeout_seconds, is_custom")
      .eq("enabled", true)
      .then(({ data }) => {
        const result = (data || []) as ModelConfig[];
        cachedModels = result;
        setModels(result);
        setLoading(false);
      });
  }, []);

  const allModelIds = models.map((m) => m.model_name);

  const modelLabels: Record<string, string> = {};
  const modelShortLabels: Record<string, string> = {};
  for (const m of models) {
    const name = m.model_name.split("/").pop() || m.model_name;
    // Create a readable label from model name
    modelLabels[m.model_name] = m.short_label
      ? formatLabel(m.model_name)
      : formatLabel(m.model_name);
    modelShortLabels[m.model_name] = m.short_label || name.slice(0, 5);
  }

  return { models, allModelIds, modelLabels, modelShortLabels, loading };
}

function formatLabel(modelName: string): string {
  const name = modelName.split("/").pop() || modelName;
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
