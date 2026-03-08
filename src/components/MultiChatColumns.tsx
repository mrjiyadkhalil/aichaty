import { useState } from "react";
import { useModels } from "@/hooks/useModels";
import { AI_CONFIG } from "@/lib/aiConfig";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

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
  const { allModelIds, modelLabels } = useModels();
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

  // Track which provider is currently selected per "slot" — one model per provider
  // The "active" model per provider = first selected model of that provider, or first model of that provider
  const getActiveModel = (provider: string): string => {
    const models = grouped[provider];
    const selected = models.find(m => selectedModels.includes(m));
    return selected || models[0];
  };

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleSelectModel = (provider: string, newModelId: string) => {
    const models = grouped[provider];
    // Deselect all other models of same provider
    for (const m of models) {
      if (selectedModels.includes(m) && m !== newModelId) {
        onToggleModel(m);
      }
    }
    // Select the new one if not already
    if (!selectedModels.includes(newModelId)) {
      onToggleModel(newModelId);
    }
    setOpenDropdown(null);
  };

  const handleToggleProvider = (provider: string) => {
    const activeModel = getActiveModel(provider);
    onToggleModel(activeModel);
  };

  return (
    <div className="w-full">
      <div className="flex items-stretch border-b border-border/40 overflow-x-auto scrollbar-hide">
        {providerKeys.map((provider, idx) => {
          const meta = PROVIDER_META[provider] || { label: provider, icon: "●", color: "0 0% 50%" };
          const activeModel = getActiveModel(provider);
          const isActive = selectedModels.includes(activeModel);
          const isOpen = openDropdown === provider;
          const providerModels = grouped[provider];
          const label = labelsMap[activeModel] || activeModel.split("/").pop() || activeModel;

          return (
            <div
              key={provider}
              className={cn(
                "flex-1 min-w-[180px] relative",
                idx < providerKeys.length - 1 && "border-r border-border/30"
              )}
            >
              {/* Header row */}
              <div className="flex items-center justify-between px-3 py-2.5 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0" style={{ color: `hsl(${meta.color})` }}>
                    {meta.icon}
                  </span>

                  {/* Model selector dropdown trigger */}
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : provider)}
                    className="flex items-center gap-1 min-w-0 hover:text-foreground transition-colors"
                  >
                    <span className="text-sm font-medium font-['Space_Grotesk'] truncate text-foreground/90">
                      {label}
                    </span>
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )} />
                  </button>
                </div>

                <Switch
                  checked={isActive}
                  onCheckedChange={() => handleToggleProvider(provider)}
                  className="data-[state=checked]:bg-primary shrink-0"
                />
              </div>

              {/* Dropdown */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border border-border/50 rounded-b-xl shadow-lg overflow-hidden"
                    style={{ minWidth: 200 }}
                  >
                    <div className="p-1.5 space-y-0.5">
                      {/* Standard models */}
                      {providerModels.filter(m => !isPremiumModel(m)).length > 0 && (
                        <>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 px-2.5 py-1 font-semibold">
                            Standard
                          </p>
                          {providerModels.filter(m => !isPremiumModel(m)).map(modelId => {
                            const mLabel = labelsMap[modelId] || modelId.split("/").pop() || modelId;
                            const isCurrent = modelId === activeModel;
                            return (
                              <button
                                key={modelId}
                                onClick={() => handleSelectModel(provider, modelId)}
                                className={cn(
                                  "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all",
                                  isCurrent
                                    ? "text-foreground font-medium"
                                    : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
                                )}
                              >
                                {isCurrent && <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />}
                                <span className={cn("truncate font-['Space_Grotesk']", !isCurrent && "ml-5.5")}>
                                  {mLabel}
                                </span>
                              </button>
                            );
                          })}
                        </>
                      )}

                      {/* Premium models */}
                      {providerModels.filter(m => isPremiumModel(m)).length > 0 && (
                        <>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 px-2.5 py-1 font-semibold mt-1">
                            Premium
                          </p>
                          {providerModels.filter(m => isPremiumModel(m)).map(modelId => {
                            const mLabel = labelsMap[modelId] || modelId.split("/").pop() || modelId;
                            const isCurrent = modelId === activeModel;
                            return (
                              <button
                                key={modelId}
                                onClick={() => handleSelectModel(provider, modelId)}
                                className={cn(
                                  "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all",
                                  isCurrent
                                    ? "text-foreground font-medium"
                                    : "text-foreground/70 hover:bg-muted/50 hover:text-foreground"
                                )}
                              >
                                {isCurrent ? (
                                  <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />
                                ) : (
                                  <Lock className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                                )}
                                <span className="truncate font-['Space_Grotesk']">{mLabel}</span>
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper: check if a model is premium based on model_configs or name heuristic
function isPremiumModel(modelId: string): boolean {
  const name = modelId.toLowerCase();
  return name.includes("pro") || name.includes("gpt-5") && !name.includes("mini") && !name.includes("nano")
    || name.includes("claude-4-sonnet") || name.includes("mistral-large");
}
