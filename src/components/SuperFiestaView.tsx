import { useState } from "react";
import { Send, Plus, Mic, Sparkles, Globe, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AI_CONFIG } from "@/lib/aiConfig";

interface SuperFiestaViewProps {
  onSend: (prompt: string) => void;
  onEnhance: (prompt: string) => void;
  onAttachFiles: () => void;
  disabled: boolean;
  enhancing: boolean;
  selectedModels: string[];
  enabledModels: string[];
  onToggleModel: (modelId: string) => void;
}

export function SuperFiestaView({
  onSend, onEnhance, onAttachFiles, disabled, enhancing,
  selectedModels, enabledModels, onToggleModel,
}: SuperFiestaViewProps) {
  const [prompt, setPrompt] = useState("");

  const handleSend = () => {
    if (!prompt.trim() || disabled) return;
    onSend(prompt.trim());
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Greeting */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-['Space_Grotesk'] tracking-tight">
          What can I help you with?
        </h1>
        <p className="text-muted-foreground text-sm">
          Ask anything — powered by the best AI models
        </p>
      </div>

      {/* Large centered input */}
      <div className="w-full relative group">
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
            placeholder="Ask me anything..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm placeholder:text-muted-foreground/60 min-h-[24px] max-h-[120px]"
            disabled={disabled}
            style={{ fieldSizing: "content" } as any}
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onEnhance(prompt)}
              disabled={!prompt.trim() || enhancing || disabled}
              className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30"
              title="Enhance prompt"
            >
              <Sparkles className="h-4 w-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={!prompt.trim() || disabled}
              className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-glow-sm hover:shadow-glow transition-all disabled:opacity-30 disabled:shadow-none"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Action chips */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 border border-border/40 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
          <Globe className="h-3.5 w-3.5" />
          Web Search
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 border border-border/40 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
          <Image className="h-3.5 w-3.5" />
          Generate Image
        </button>
      </div>

      {/* Model selection */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <span className="text-xs text-muted-foreground/60 mr-1">Models:</span>
        {AI_CONFIG.allModels.map((modelId) => {
          const isSelected = selectedModels.includes(modelId);
          const isEnabled = enabledModels.includes(modelId);
          return (
            <Badge
              key={modelId}
              variant={isSelected ? "default" : "outline"}
              className={`cursor-pointer text-xs transition-all select-none ${
                isSelected
                  ? "bg-primary/20 text-primary border-primary/30 shadow-glow-sm"
                  : "border-border/40 text-muted-foreground/60 hover:border-primary/30 hover:text-muted-foreground"
              } ${!isEnabled ? "opacity-20 cursor-not-allowed" : "hover:scale-105"}`}
              onClick={() => isEnabled && onToggleModel(modelId)}
            >
              {AI_CONFIG.modelShortLabels[modelId] || modelId}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
