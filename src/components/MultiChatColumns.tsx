import { useState, useRef, useEffect } from "react";
import { useModels, ModelConfig } from "@/hooks/useModels";
import { AI_CONFIG } from "@/lib/aiConfig";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, Check, Lock, ExternalLink, Info } from "lucide-react";
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
  const { models, allModelIds, modelLabels } = useModels();
  const allModels = allModelIds.length > 0 ? allModelIds : AI_CONFIG.allModels;
  const labelsMap = allModelIds.length > 0 ? modelLabels : AI_CONFIG.modelLabels;

  // Build premium lookup from DB models
  const premiumSet = new Set<string>();
  for (const m of models) {
    if (m.premium_only) premiumSet.add(m.model_name);
  }
  // Fallback heuristic if no DB models
  const isPremium = (modelId: string): boolean => {
    if (models.length > 0) return premiumSet.has(modelId);
    const n = modelId.toLowerCase();
    return (n.includes("pro") || (n.includes("gpt-5") && !n.includes("mini") && !n.includes("nano")) || n.includes("claude-4-sonnet") || n.includes("mistral-large"));
  };

  // Group by provider
  const grouped: Record<string, string[]> = {};
  for (const modelId of allModels) {
    const provider = modelId.split("/")[0] || "other";
    if (!grouped[provider]) grouped[provider] = [];
    grouped[provider].push(modelId);
  }
  const providerKeys = Object.keys(grouped);

  const getActiveModel = (provider: string): string => {
    const pModels = grouped[provider];
    return pModels.find(m => selectedModels.includes(m)) || pModels[0];
  };

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openDropdown]);

  const handleSelectModel = (provider: string, newModelId: string) => {
    const pModels = grouped[provider];
    for (const m of pModels) {
      if (selectedModels.includes(m) && m !== newModelId) onToggleModel(m);
    }
    if (!selectedModels.includes(newModelId)) onToggleModel(newModelId);
    setOpenDropdown(null);
  };

  const handleToggleProvider = (provider: string) => {
    onToggleModel(getActiveModel(provider));
  };

  return (
    <div className="w-full" ref={containerRef}>
      <div className="flex items-stretch border-b border-border/30 overflow-x-auto scrollbar-hide">
        {providerKeys.map((provider, idx) => {
          const meta = PROVIDER_META[provider] || { label: provider, icon: "●", color: "0 0% 50%" };
          const activeModel = getActiveModel(provider);
          const isActive = selectedModels.includes(activeModel);
          const isOpen = openDropdown === provider;
          const providerModels = grouped[provider];
          const label = labelsMap[activeModel] || activeModel.split("/").pop() || activeModel;
          const standardModels = providerModels.filter(m => !isPremium(m));
          const premiumModels = providerModels.filter(m => isPremium(m));

          return (
            <div
              key={provider}
              className={cn(
                "flex-1 min-w-[200px] relative",
                idx < providerKeys.length - 1 && "border-r border-border/20"
              )}
            >
              {/* Top bar row — matches screenshot exactly */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Provider icon */}
                <span
                  className="text-lg shrink-0"
                  style={{ color: `hsl(${meta.color})` }}
                >
                  {meta.icon}
                </span>

                {/* Model name + dropdown */}
                <button
                  onClick={() => setOpenDropdown(isOpen ? null : provider)}
                  className="flex items-center gap-1.5 min-w-0"
                >
                  <span className="text-[13px] font-medium truncate text-foreground/90">
                    {label}
                  </span>
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )} />
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* External link icon */}
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />

                {/* Toggle */}
                <Switch
                  checked={isActive}
                  onCheckedChange={() => handleToggleProvider(provider)}
                  className="data-[state=checked]:bg-emerald-500 shrink-0"
                />
              </div>

              {/* Dropdown menu */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full left-0 z-50 bg-[hsl(var(--card))] border border-border/50 rounded-xl shadow-2xl overflow-hidden"
                    style={{ minWidth: 210 }}
                  >
                    <div className="py-2 px-1.5">
                      {/* Standard */}
                      {standardModels.length > 0 && (
                        <>
                          <p className="text-[11px] font-bold text-foreground/80 px-3 py-1.5">
                            Standard
                          </p>
                          {standardModels.map(modelId => {
                            const mLabel = labelsMap[modelId] || modelId.split("/").pop() || modelId;
                            const isCurrent = modelId === activeModel;
                            return (
                              <button
                                key={modelId}
                                onClick={() => handleSelectModel(provider, modelId)}
                                className={cn(
                                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
                                  isCurrent
                                    ? "text-foreground font-medium"
                                    : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
                                )}
                              >
                                {isCurrent ? (
                                  <Check className="h-3.5 w-3.5 shrink-0" />
                                ) : (
                                  <span className="w-3.5 shrink-0" />
                                )}
                                <span className="truncate">{mLabel}</span>
                              </button>
                            );
                          })}
                        </>
                      )}

                      {/* Premium */}
                      {premiumModels.length > 0 && (
                        <>
                          <p className="text-[11px] font-bold text-foreground/80 px-3 py-1.5 mt-1">
                            Premium
                          </p>
                          {premiumModels.map(modelId => {
                            const mLabel = labelsMap[modelId] || modelId.split("/").pop() || modelId;
                            const isCurrent = modelId === activeModel;
                            return (
                              <button
                                key={modelId}
                                onClick={() => handleSelectModel(provider, modelId)}
                                className={cn(
                                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
                                  isCurrent
                                    ? "text-foreground font-medium"
                                    : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
                                )}
                              >
                                {isCurrent ? (
                                  <Check className="h-3.5 w-3.5 shrink-0" />
                                ) : (
                                  <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                                )}
                                <span className="truncate">{mLabel}</span>
                                {!isCurrent && (
                                  <Info className="h-3 w-3 shrink-0 text-muted-foreground/40 ml-auto" />
                                )}
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
