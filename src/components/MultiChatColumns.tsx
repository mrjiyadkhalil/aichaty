import { useState } from "react";
import { Send, Plus, Sparkles, ChevronDown, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AI_CONFIG } from "@/lib/aiConfig";

const MODEL_ICONS: Record<string, { label: string; color: string; shortLabel: string }> = {
  "google/gemini-3-flash-preview": { label: "Gemini 3 Flash", color: "var(--model-1)", shortLabel: "Gemini" },
  "google/gemini-2.5-flash": { label: "Gemini 2.5 Flash", color: "var(--model-1)", shortLabel: "Gemini" },
  "google/gemini-2.5-pro": { label: "Gemini 2.5 Pro", color: "var(--model-1)", shortLabel: "Gemini" },
  "openai/gpt-5": { label: "GPT-5", color: "var(--model-2)", shortLabel: "GPT" },
  "openai/gpt-5-mini": { label: "GPT-5 Mini", color: "var(--model-2)", shortLabel: "GPT" },
  "openai/gpt-5-nano": { label: "GPT-5 Nano", color: "var(--model-2)", shortLabel: "GPT" },
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

  const displayModels = enabledModels.slice(0, 4);

  const handleSend = () => {
    if (!prompt.trim() || disabled || !onSend) return;
    onSend(prompt.trim());
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Model columns */}
      <div className="w-full max-w-5xl">
        <div className={`grid gap-3 ${compact ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-4"}`}>
          {displayModels.map((modelId) => {
            const info = MODEL_ICONS[modelId] || { label: modelId, color: "var(--model-5)", shortLabel: modelId.split("/")[1] || modelId };
            const isSelected = selectedModels.includes(modelId);

            return (
              <div
                key={modelId}
                className={`glass-card p-4 flex flex-col items-center gap-3 transition-all duration-300 cursor-pointer ${
                  isSelected ? "glow-border" : "opacity-50 hover:opacity-80"
                } ${compact ? "py-3" : ""}`}
                onClick={() => onToggleModel(modelId)}
              >
                {/* Model icon circle */}
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                  style={{
                    borderColor: `hsl(${info.color})`,
                    backgroundColor: isSelected ? `hsl(${info.color} / 0.15)` : "transparent",
                    color: `hsl(${info.color})`,
                  }}
                >
                  {info.shortLabel.slice(0, 2).toUpperCase()}
                </div>

                {/* Model name */}
                <div className="text-center">
                  <p className="text-xs font-semibold font-['Space_Grotesk'] truncate">{info.label}</p>
                  {!compact && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {isSelected ? "Active" : "Tap to enable"}
                    </p>
                  )}
                </div>

                {/* Toggle indicator */}
                <div className={`h-1.5 w-8 rounded-full transition-colors ${isSelected ? "bg-primary" : "bg-border"}`} />
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

          {/* Selected model badges */}
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
