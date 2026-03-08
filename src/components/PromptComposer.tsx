import { useState } from "react";
import { Send, Sparkles, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AI_CONFIG } from "@/lib/aiConfig";

interface SelectedFile {
  id: string;
  name: string;
}

interface PromptComposerProps {
  onSend: (prompt: string) => void;
  onEnhance: (prompt: string) => void;
  onAttachFiles: () => void;
  selectedModels: string[];
  onToggleModel: (modelId: string) => void;
  selectedFiles: SelectedFile[];
  onRemoveFile: (fileId: string) => void;
  useProjectInstruction: boolean;
  onToggleInstruction: (v: boolean) => void;
  hasProjectInstruction: boolean;
  disabled: boolean;
  enhancing: boolean;
  enabledModels?: string[];
}

export function PromptComposer({
  onSend,
  onEnhance,
  onAttachFiles,
  selectedModels,
  onToggleModel,
  selectedFiles,
  onRemoveFile,
  useProjectInstruction,
  onToggleInstruction,
  hasProjectInstruction,
  disabled,
  enhancing,
  enabledModels,
}: PromptComposerProps) {
  const [prompt, setPrompt] = useState("");

  const allowedModels = enabledModels || AI_CONFIG.allModels;

  const handleSend = () => {
    if (!prompt.trim()) return;
    if (selectedModels.length === 0) {
      toast.warning("Select at least one model before sending");
      return;
    }
    if (prompt.length > AI_CONFIG.limits.maxPromptLength) {
      toast.warning(`Prompt too long (max ${AI_CONFIG.limits.maxPromptLength} chars)`);
      return;
    }
    onSend(prompt.trim());
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-sm p-4 space-y-3">
      <div className="max-w-5xl mx-auto space-y-3">
        {/* Model chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Models:</span>
          {AI_CONFIG.allModels.map((modelId) => {
            const isSelected = selectedModels.includes(modelId);
            const isEnabled = allowedModels.includes(modelId);
            return (
              <Badge
                key={modelId}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer text-xs transition-all select-none ${!isEnabled ? "opacity-40 cursor-not-allowed" : "hover:scale-105"}`}
                onClick={() => isEnabled && onToggleModel(modelId)}
              >
                {AI_CONFIG.modelShortLabels[modelId] || modelId}
                {isSelected && <X className="h-3 w-3 ml-1" />}
              </Badge>
            );
          })}
        </div>

        {/* File chips + instruction toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          {selectedFiles.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground">Files:</span>
              {selectedFiles.map((f) => (
                <Badge key={f.id} variant="secondary" className="text-xs gap-1">
                  {f.name}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => onRemoveFile(f.id)} />
                </Badge>
              ))}
            </div>
          )}
          {hasProjectInstruction && (
            <div className="flex items-center gap-2 ml-auto">
              <Switch
                id="use-instruction"
                checked={useProjectInstruction}
                onCheckedChange={onToggleInstruction}
              />
              <Label htmlFor="use-instruction" className="text-xs text-muted-foreground cursor-pointer">
                Use Project Instruction
              </Label>
            </div>
          )}
        </div>

        {/* Textarea + actions */}
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... Compare responses across models."
            className="min-h-[90px] pr-4 pb-14 resize-none bg-background/80 border-border/50 focus:border-primary/50"
            disabled={disabled}
          />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary"
                onClick={() => onEnhance(prompt)}
                disabled={!prompt.trim() || enhancing || disabled}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Enhance Prompt
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary"
                onClick={onAttachFiles}
                disabled={disabled}
              >
                <Paperclip className="h-3.5 w-3.5" />
                Attach File Context
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{prompt.length}/{AI_CONFIG.limits.maxPromptLength}</span>
              <Button
                size="sm"
                className="h-8 gap-1.5"
                onClick={handleSend}
                disabled={!prompt.trim() || disabled}
              >
                <Send className="h-3.5 w-3.5" />
                Send to Models
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
