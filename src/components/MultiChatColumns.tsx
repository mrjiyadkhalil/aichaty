import { useState } from "react";
import { Send, Plus, Sparkles, ExternalLink, Minimize2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { AI_CONFIG } from "@/lib/aiConfig";
import { useModels } from "@/hooks/useModels";
import { motion, AnimatePresence } from "framer-motion";
import { motion, AnimatePresence } from "framer-motion";

const MODEL_ICONS: Record<string, { label: string; color: string; icon: string }> = {
  "google/gemini-3-flash-preview": { label: "Gemini 3 Flash", color: "var(--model-1)", icon: "✦" },
  "google/gemini-2.5-flash": { label: "Gemini 2.5 Flash", color: "var(--model-1)", icon: "✦" },
  "google/gemini-2.5-flash-lite": { label: "Gemini 2.5 Lite", color: "var(--model-1)", icon: "✦" },
  "google/gemini-2.5-pro": { label: "Gemini 2.5 Pro", color: "var(--model-1)", icon: "✦" },
  "openai/gpt-5": { label: "GPT-5", color: "var(--model-2)", icon: "◎" },
  "openai/gpt-5-mini": { label: "GPT-5 mini", color: "var(--model-2)", icon: "◎" },
  "openai/gpt-5-nano": { label: "GPT-5 Nano", color: "var(--model-2)", icon: "◎" },
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
  selectedModels, enabledModels, onToggleModel,
  onSend, onEnhance, onAttachFiles,
  disabled, enhancing, compact,
}: MultiChatColumnsProps) {
  const [prompt, setPrompt] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const displayModels = enabledModels.slice(0, 4);
  const { allModelIds } = useModels();
  const allModels = allModelIds.length > 0 ? allModelIds : AI_CONFIG.allModels;

  const handleSend = () => {
    if (!prompt.trim() || disabled || !onSend) return;
    onSend(prompt.trim());
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const handleSwapModel = (colIndex: number, newModelId: string) => {
    // If current model in that slot is selected, deselect it
    const currentModel = displayModels[colIndex];
    if (currentModel && selectedModels.includes(currentModel)) {
      onToggleModel(currentModel);
    }
    // Toggle the new model on
    if (!selectedModels.includes(newModelId)) {
      onToggleModel(newModelId);
    }
    setExpandedIndex(null);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Model row — horizontal bar */}
      <div className="w-full max-w-5xl">
        <div className="flex items-center border-b border-border/40 relative">
          {displayModels.map((modelId, idx) => {
            const info = MODEL_ICONS[modelId] || { label: modelId.split("/")[1] || modelId, color: "var(--model-5)", icon: "●" };
            const isSelected = selectedModels.includes(modelId);
            const isExpanded = expandedIndex === idx;

            return (
              <div
                key={modelId}
                className={`flex-1 relative ${
                  idx < displayModels.length - 1 ? "border-r border-border/40" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-sm shrink-0"
                      style={{ color: `hsl(${info.color})` }}
                    >
                      {info.icon}
                    </span>
                    <span className="text-sm font-medium font-['Space_Grotesk'] truncate text-foreground/90">
                      {info.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleExpand(idx)}
                      className={`text-muted-foreground/50 hover:text-foreground transition-colors ${isExpanded ? "text-primary" : ""}`}
                    >
                      {isExpanded ? (
                        <Minimize2 className="h-3.5 w-3.5" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <Switch
                      checked={isSelected}
                      onCheckedChange={() => onToggleModel(modelId)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>

                {/* Expanded model picker dropdown */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border border-border/50 rounded-b-xl shadow-lg overflow-hidden"
                      style={{ minWidth: 220 }}
                    >
                      <div className="p-2 space-y-0.5">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-2 py-1 font-medium">
                          Swap model
                        </p>
                        {allModels.map((mid) => {
                          const mInfo = MODEL_ICONS[mid] || { label: mid.split("/")[1] || mid, color: "var(--model-5)", icon: "●" };
                          const isCurrent = mid === modelId;
                          const isActive = selectedModels.includes(mid);

                          return (
                            <button
                              key={mid}
                              onClick={() => handleSwapModel(idx, mid)}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all ${
                                isCurrent
                                  ? "bg-primary/15 text-primary font-medium"
                                  : "text-foreground/80 hover:bg-surface-hover"
                              }`}
                            >
                              <span
                                className="text-sm shrink-0"
                                style={{ color: `hsl(${mInfo.color})` }}
                              >
                                {mInfo.icon}
                              </span>
                              <span className="truncate font-['Space_Grotesk']">{mInfo.label}</span>
                              {isActive && !isCurrent && (
                                <span className="ml-auto text-[10px] text-muted-foreground">in use</span>
                              )}
                              {isCurrent && (
                                <span className="ml-auto text-[10px] text-primary">current</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prompt area (only in non-compact / empty state) */}
      {!compact && onSend && (
        <>
          <div className="w-full max-w-3xl relative group">
            <div className="absolute -inset-0.5 bg-primary/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl px-4 py-3 gap-3 focus-within:border-primary/40 focus-within:shadow-glow transition-all duration-300">
              <button
                onClick={onAttachFiles}
                className="h-9 w-9 rounded-xl bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
              >
                <Plus className="h-4 w-4" />
              </button>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Compare across all models..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm placeholder:text-muted-foreground/60 min-h-[24px] max-h-[120px]"
                disabled={disabled}
                style={{ fieldSizing: "content" } as any}
              />
              <div className="flex items-center gap-2 shrink-0">
                {onEnhance && (
                  <button
                    onClick={() => onEnhance(prompt)}
                    disabled={!prompt.trim() || enhancing || disabled}
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={handleSend}
                  disabled={!prompt.trim() || disabled || selectedModels.length === 0}
                  className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-glow-sm hover:shadow-glow transition-all disabled:opacity-30 disabled:shadow-none"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <span className="text-xs text-muted-foreground/60">
              {selectedModels.length} model{selectedModels.length !== 1 ? "s" : ""} selected
            </span>
          </div>
        </>
      )}
    </div>
  );
}
