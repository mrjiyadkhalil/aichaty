import { useState } from "react";
import { Send, Sparkles, Paperclip, X, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AI_CONFIG } from "@/lib/aiConfig";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { ImageUploadButton } from "@/components/ImageUploadButton";
import { cn } from "@/lib/utils";
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
  onImageSelected?: (base64: string, mimeType: string) => void;
  onImageRemoved?: () => void;
  hasImage?: boolean;
}

export function PromptComposer({
  onSend, onEnhance, onAttachFiles, selectedModels, onToggleModel,
  selectedFiles = [], onRemoveFile, useProjectInstruction = false, onToggleInstruction,
  hasProjectInstruction = false, disabled, enhancing, enabledModels, chatMode = "superfiesta",
  onImageSelected, onImageRemoved, hasImage = false,
}: PromptComposerProps) {
  const [prompt, setPrompt] = useState("");
  const allowedModels = enabledModels || AI_CONFIG.allModels;
  const isSuperFiesta = chatMode === "superfiesta";

  const { isRecording, toggleRecording } = useVoiceInput((text) => {
    setPrompt((prev) => (prev ? prev + " " + text : text));
  });

  const handleSend = () => {
    if (!prompt.trim()) return;
    if (!isSuperFiesta && selectedModels.length === 0) { toast.warning("Select at least one model"); return; }
    if (prompt.length > AI_CONFIG.limits.maxPromptLength) { toast.warning(`Prompt too long`); return; }
    onSend(prompt.trim());
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="sticky bottom-0 z-30 bg-background px-2 sm:px-4 pb-3 sm:pb-4 pt-2">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Model chips for multi-chat - horizontal scroll on mobile */}
        {!isSuperFiesta && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 px-1 scrollbar-hide">
            {AI_CONFIG.allModels.map((modelId) => {
              const isSelected = selectedModels.includes(modelId);
              const isEnabled = allowedModels.includes(modelId);
              return (
                <button
                  key={modelId}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-150 whitespace-nowrap shrink-0 min-h-[32px]",
                    isSelected
                      ? "bg-secondary border-border text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted",
                    !isEnabled && "opacity-30 cursor-not-allowed"
                  )}
                  onClick={() => isEnabled && onToggleModel(modelId)}
                >
                  {AI_CONFIG.modelShortLabels[modelId] || modelId}
                </button>
              );
            })}
          </div>
        )}

        {/* File chips + instruction toggle */}
        {(selectedFiles.length > 0 || (hasProjectInstruction && onToggleInstruction)) && (
          <div className="flex items-center gap-2 flex-wrap px-1">
            {selectedFiles.map((f) => (
              <span key={f.id} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {f.name}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => onRemoveFile?.(f.id)} />
              </span>
            ))}
            {hasProjectInstruction && onToggleInstruction && (
              <div className="flex items-center gap-1.5 ml-auto">
                <Switch id="use-instruction" checked={useProjectInstruction} onCheckedChange={onToggleInstruction} className="h-4 w-7" />
                <Label htmlFor="use-instruction" className="text-[11px] text-muted-foreground cursor-pointer">Instructions</Label>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="relative bg-card border border-border rounded-2xl transition-all duration-200 focus-within:border-muted-foreground/30">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSuperFiesta ? "Message Fiesta AI..." : "Compare across models..."}
            rows={1}
            className="w-full bg-transparent border-none outline-none resize-none text-sm placeholder:text-muted-foreground/50 px-3 sm:px-4 pt-3 sm:pt-3.5 pb-12 min-h-[52px] max-h-[180px]"
            disabled={disabled}
            style={{ fieldSizing: "content" } as any}
          />
          <div className="absolute bottom-2 left-1.5 sm:left-2 right-1.5 sm:right-2 flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <button onClick={() => onEnhance(prompt)} disabled={!prompt.trim() || enhancing || disabled} className="h-9 w-9 min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 disabled:opacity-30">
                <Sparkles className="h-4 w-4" />
              </button>
              {onAttachFiles && (
                <button onClick={onAttachFiles} disabled={disabled} className="h-9 w-9 min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150">
                  <Paperclip className="h-4 w-4" />
                </button>
              )}
              {onImageSelected && onImageRemoved && (
                <ImageUploadButton onImageSelected={onImageSelected} onImageRemoved={onImageRemoved} hasImage={hasImage} disabled={disabled} />
              )}
              <button onClick={toggleRecording} disabled={disabled} className={cn("h-9 w-9 min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center transition-colors duration-150", isRecording ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground/40 hidden sm:inline">{prompt.length}/{AI_CONFIG.limits.maxPromptLength}</span>
              <button onClick={handleSend} disabled={!prompt.trim() || disabled} className="h-9 w-9 min-h-[36px] min-w-[36px] rounded-lg bg-foreground flex items-center justify-center text-background transition-all duration-150 disabled:opacity-20">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
