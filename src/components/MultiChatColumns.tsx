import { useModels, ModelConfig } from "@/hooks/useModels";
import { AI_CONFIG } from "@/lib/aiConfig";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Provider display config
const PROVIDER_META: Record<string, { label: string; icon: string; color: string }> = {
  google: { label: "Gemini", icon: "✦", color: "210 60% 55%" },
  openai: { label: "ChatGPT", icon: "◎", color: "160 60% 45%" },
  anthropic: { label: "Anthropic", icon: "◆", color: "25 80% 55%" },
  deepseek: { label: "DeepSeek", icon: "◈", color: "220 70% 60%" },
  mistral: { label: "Mistral", icon: "✶", color: "280 55% 55%" },
  kimi: { label: "Kimi", icon: "◉", color: "340 60% 55%" },
};

interface MultiChatColumnsProps {
  selectedModels: string[];
  enabledModels: string[];
  onToggleModel: (modelId: string) => void;
  onSend?: (prompt: string) => void;
  onEnhance?: (prompt: string) => void;
  onAttachFiles?: () => void;
  disabled?: boolean;
  enhancing?: boolean;
  compact?: boolean;
}

export function MultiChatColumns({
  selectedModels, enabledModels, onToggleModel, compact,
}: MultiChatColumnsProps) {
  const { models, allModelIds, modelLabels } = useModels();
  const allModels = allModelIds.length > 0 ? allModelIds : AI_CONFIG.allModels;
  const labelsMap = allModelIds.length > 0 ? modelLabels : AI_CONFIG.modelLabels;

  // Group models by provider
  const grouped: Record<string, string[]> = {};
  for (const modelId of allModels) {
    const provider = modelId.split("/")[0] || "other";
    if (!grouped[provider]) grouped[provider] = [];
    grouped[provider].push(modelId);
  }

  const providerKeys = Object.keys(grouped);

  return (
    <div className="w-full max-w-5xl mx-auto px-2">
      <div className={cn(
        "grid gap-3",
        providerKeys.length <= 2 ? "grid-cols-1 sm:grid-cols-2" :
        providerKeys.length <= 3 ? "grid-cols-1 sm:grid-cols-3" :
        "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      )}>
        {providerKeys.map((provider) => {
          const meta = PROVIDER_META[provider] || { label: provider, icon: "●", color: "0 0% 50%" };
          const providerModels = grouped[provider];
          const selectedCount = providerModels.filter(m => selectedModels.includes(m)).length;

          return (
            <div
              key={provider}
              className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-xl overflow-hidden"
            >
              {/* Provider header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30">
                <span
                  className="text-base"
                  style={{ color: `hsl(${meta.color})` }}
                >
                  {meta.icon}
                </span>
                <span className="text-sm font-semibold font-['Space_Grotesk'] text-foreground/90">
                  {meta.label}
                </span>
                {selectedCount > 0 && (
                  <span className="ml-auto text-[10px] font-medium bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                    {selectedCount}
                  </span>
                )}
              </div>

              {/* Models list */}
              <div className="p-1.5 space-y-0.5">
                {providerModels.map((modelId) => {
                  const isSelected = selectedModels.includes(modelId);
                  const isEnabled = enabledModels.includes(modelId);
                  const label = labelsMap[modelId] || modelId.split("/").pop() || modelId;

                  return (
                    <button
                      key={modelId}
                      onClick={() => isEnabled && onToggleModel(modelId)}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-all duration-150",
                        isSelected
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        !isEnabled && "opacity-30 cursor-not-allowed"
                      )}
                    >
                      <span className="truncate font-medium font-['Space_Grotesk']">
                        {label}
                      </span>
                      <Switch
                        checked={isSelected}
                        onCheckedChange={() => isEnabled && onToggleModel(modelId)}
                        className="data-[state=checked]:bg-primary scale-90 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected count */}
      <div className="flex justify-center mt-3">
        <span className="text-xs text-muted-foreground/60">
          {selectedModels.length} model{selectedModels.length !== 1 ? "s" : ""} selected
        </span>
      </div>
    </div>
  );
}
