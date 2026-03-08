import { useState } from "react";
import { Send, Sparkles, Paperclip, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AI_CONFIG } from "@/lib/aiConfig";
import type { ChatMode } from "@/pages/ChatWorkspace";

interface SelectedFile { id: string; name: string; }

interface PromptComposerProps {
  onSend: (prompt: string) => void;
  onEnhance: (prompt: string) => void;
  onAttachFiles?: () => void;
  selectedModels: string[];
  onToggleModel: (modelId: string) => void;
  selectedFiles?: SelectedFile[];
  onRemoveFile?: (fileId: string) => void;
  useProjectInstruction?: boolean;
  onToggleInstruction?: (v: boolean) => void;
  hasProjectInstruction?: boolean;
  disabled: boolean;
  enhancing: boolean;
  enabledModels?: string[];
  chatMode?: ChatMode;
}

export function PromptComposer({
  onSend, onEnhance, onAttachFiles, selectedModels, onToggleModel,
  selectedFiles = [], onRemoveFile, useProjectInstruction = false, onToggleInstruction,
  hasProjectInstruction = false, disabled, enhancing, enabledModels, chatMode = "superfiesta",
}: PromptComposerProps) {
  const [prompt, setPrompt] = useState("");
  const allowedModels = enabledModels || AI_CONFIG.allModels;
  const isSuperFiesta = chatMode === "superfiesta";


  const handleSend = () => {
    if (!prompt.trim()) return;
    if (!isSuperFiesta && selectedModels.length === 0) { toast.warning("Select at least one model before sending"); return; }
    if (prompt.length > AI_CONFIG.limits.maxPromptLength) { toast.warning(`Prompt too long (max ${AI_CONFIG.limits.maxPromptLength} chars)`); return; }
    onSend(prompt.trim());
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="border-t border-border/30 bg-card/30 backdrop-blur-xl p-4 space-y-3">
      <div className="max-w-5xl mx-auto space-y-3">
        {/* Model chips — only in Multi-Chat mode */}
        {!isSuperFiesta && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Models:</span>
            {AI_CONFIG.allModels.map((modelId) => {
              const isSelected = selectedModels.includes(modelId);
              const isEnabled = allowedModels.includes(modelId);
              return (
                <Badge
                  key={modelId}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer text-xs transition-all select-none ${
                    isSelected ? "bg-primary text-primary-foreground shadow-glow-sm" : "border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  } ${!isEnabled ? "opacity-30 cursor-not-allowed" : "hover:scale-105"}`}
                  onClick={() => isEnabled && onToggleModel(modelId)}
                >
                  {AI_CONFIG.modelShortLabels[modelId] || modelId}
                  {isSelected && <X className="h-3 w-3 ml-1" />}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Super Fiesta auto-routing indicator */}
        {isSuperFiesta && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <Zap className="h-3.5 w-3.5 text-primary/60" />
            <span>Auto-routing — best model selected automatically</span>
          </div>
        )}

        {/* File chips + instruction toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          {selectedFiles.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground">Files:</span>
              {selectedFiles.map((f) => (
                <Badge key={f.id} variant="secondary" className="text-xs gap-1 bg-secondary/50">
                  {f.name}
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => onRemoveFile?.(f.id)} />
                </Badge>
              ))}
            </div>
          )}
          {hasProjectInstruction && onToggleInstruction && (
            <div className="flex items-center gap-2 ml-auto">
              <Switch id="use-instruction" checked={useProjectInstruction} onCheckedChange={onToggleInstruction} />
              <Label htmlFor="use-instruction" className="text-xs text-muted-foreground cursor-pointer">Use Project Instruction</Label>
            </div>
          )}
        </div>

        {/* Textarea + actions */}
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSuperFiesta ? "Ask anything..." : "Ask anything... Compare responses across models."}
            className="min-h-[90px] pr-4 pb-14 resize-none bg-background/50 border-border/30 focus:border-primary/50 focus:shadow-glow-sm transition-shadow"
            disabled={disabled}
          />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary" onClick={() => onEnhance(prompt)} disabled={!prompt.trim() || enhancing || disabled}>
                <Sparkles className="h-3.5 w-3.5" /> Enhance
              </Button>
              {onAttachFiles && (
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary" onClick={onAttachFiles} disabled={disabled}>
                  <Paperclip className="h-3.5 w-3.5" /> Attach
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{prompt.length}/{AI_CONFIG.limits.maxPromptLength}</span>
              <Button size="sm" className="h-8 gap-1.5 shadow-glow-sm hover:shadow-glow transition-shadow" onClick={handleSend} disabled={!prompt.trim() || disabled}>
                <Send className="h-3.5 w-3.5" /> Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
