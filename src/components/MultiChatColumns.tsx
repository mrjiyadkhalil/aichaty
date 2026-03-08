import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useModels } from "@/hooks/useModels";
import { AI_CONFIG } from "@/lib/aiConfig";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, Check, Lock, MessageSquareShare, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

  const premiumSet = new Set(models.filter(m => m.premium_only).map(m => m.model_name));
  const isPremium = (modelId: string): boolean => {
    if (models.length > 0) return premiumSet.has(modelId);
    const n = modelId.toLowerCase();
    return (n.includes("pro") || (n.includes("gpt-5") && !n.includes("mini") && !n.includes("nano")) || n.includes("claude-4-sonnet") || n.includes("mistral-large"));
  };

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
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((provider: string) => {
    const btn = triggerRefs.current[provider];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
  }, []);

  const toggleDropdown = (provider: string) => {
    if (openDropdown === provider) {
      setOpenDropdown(null);
      setDropdownPos(null);
    } else {
      setOpenDropdown(provider);
      updatePosition(provider);
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const triggerBtn = triggerRefs.current[openDropdown];
      if (triggerBtn?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpenDropdown(null);
      setDropdownPos(null);
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
    setDropdownPos(null);
  };

  const handleToggleProvider = (provider: string) => {
    onToggleModel(getActiveModel(provider));
  };

  // Render dropdown via portal
  const renderDropdown = () => {
    if (!openDropdown || !dropdownPos) return null;
    const provider = openDropdown;
    const providerModels = grouped[provider] || [];
    const activeModel = getActiveModel(provider);
    const standardModels = providerModels.filter(m => !isPremium(m));
    const premiumModels = providerModels.filter(m => isPremium(m));

    return createPortal(
      <div
        ref={dropdownRef}
        className="fixed z-[9999] bg-[hsl(var(--card))] border border-border/50 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
        style={{ top: dropdownPos.top, left: dropdownPos.left, minWidth: 210 }}
      >
        <div className="py-2 px-1.5">
          {standardModels.length > 0 && (
            <>
              <p className="text-[11px] font-bold text-foreground/80 px-3 py-1.5">Standard</p>
              {standardModels.map(modelId => {
                const mLabel = labelsMap[modelId] || modelId.split("/").pop() || modelId;
                const isCurrent = modelId === activeModel;
                return (
                  <button
                    key={modelId}
                    onClick={() => handleSelectModel(provider, modelId)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
                      isCurrent ? "text-foreground font-medium" : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {isCurrent ? <Check className="h-3.5 w-3.5 shrink-0" /> : <span className="w-3.5 shrink-0" />}
                    <span className="truncate">{mLabel}</span>
                  </button>
                );
              })}
            </>
          )}
          {premiumModels.length > 0 && (
            <>
              <p className="text-[11px] font-bold text-foreground/80 px-3 py-1.5 mt-1">Premium</p>
              {premiumModels.map(modelId => {
                const mLabel = labelsMap[modelId] || modelId.split("/").pop() || modelId;
                const isCurrent = modelId === activeModel;
                return (
                  <button
                    key={modelId}
                    onClick={() => handleSelectModel(provider, modelId)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
                      isCurrent ? "text-foreground font-medium" : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {isCurrent ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />}
                    <span className="truncate">{mLabel}</span>
                    {!isCurrent && <Info className="h-3 w-3 shrink-0 text-muted-foreground/40 ml-auto" />}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div className="w-full">
        <div className="flex items-stretch border-b border-border/30 overflow-x-auto scrollbar-hide">
          {providerKeys.map((provider, idx) => {
            const meta = PROVIDER_META[provider] || { label: provider, icon: "●", color: "0 0% 50%" };
            const activeModel = getActiveModel(provider);
            const isActive = selectedModels.includes(activeModel);
            const isOpen = openDropdown === provider;
            const label = labelsMap[activeModel] || activeModel.split("/").pop() || activeModel;

            return (
              <div
                key={provider}
                className={cn(
                  "flex-[1_1_380px] min-w-[90%] md:min-w-[380px]",
                  idx < providerKeys.length - 1 && "border-r border-border/20"
                )}
              >
                <div className="flex items-center justify-between h-[60px] px-2 md:px-3">
                  <div className="flex flex-1 items-center space-x-2 min-w-0">
                    <span className="text-lg shrink-0" style={{ color: `hsl(${meta.color})` }}>
                      {meta.icon}
                    </span>
                    <button
                      ref={el => { triggerRefs.current[provider] = el; }}
                      onClick={() => toggleDropdown(provider)}
                      className="flex items-center gap-1 min-w-0 border border-border/40 rounded-full px-2 py-1.5 hover:border-border transition-colors"
                    >
                      <span className="text-sm font-medium truncate text-foreground/90 max-w-[190px]">{label}</span>
                      <ChevronDown className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform duration-200",
                        isOpen && "rotate-180"
                      )} />
                    </button>
                  </div>
                  <div className="flex items-center space-x-0.5">
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => handleToggleProvider(provider)}
                      className="data-[state=checked]:bg-emerald-500 shrink-0 scale-75"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {renderDropdown()}
    </>
  );
}
