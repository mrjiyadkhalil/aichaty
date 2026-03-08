import { useState } from "react";
import { Send, Plus, Mic, MicOff, Sparkles, Zap } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { cn } from "@/lib/utils";

interface SuperFiestaViewProps {
  onSend: (prompt: string) => void;
  onEnhance: (prompt: string) => void;
  onAttachFiles?: () => void;
  disabled: boolean;
  enhancing: boolean;
  showGreeting?: boolean;
}

export function SuperFiestaView({
  onSend, onEnhance, onAttachFiles, disabled, enhancing, showGreeting = true,
}: SuperFiestaViewProps) {
  const [prompt, setPrompt] = useState("");

  const { isRecording, toggleRecording } = useVoiceInput((text) => {
    setPrompt((prev) => (prev ? prev + " " + text : text));
  });

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
      {showGreeting && (
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-['Space_Grotesk'] tracking-tight">
            What can I help you with?
          </h1>
          <p className="text-muted-foreground text-sm">
            Ask anything — the best model is chosen automatically
          </p>
        </div>
      )}

      {/* Large centered input */}
      <div className="w-full relative group">
        <div className="absolute -inset-0.5 bg-primary/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
        <div className="relative flex items-center bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl px-4 py-3 gap-3 focus-within:border-primary/40 focus-within:shadow-glow transition-all duration-300">
          {onAttachFiles && (
            <button
              onClick={onAttachFiles}
              className="h-9 w-9 rounded-xl bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
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
              onClick={toggleRecording}
              disabled={disabled}
              className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center transition-colors",
                isRecording
                  ? "text-destructive bg-destructive/10 animate-pulse"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
              title={isRecording ? "Stop recording" : "Voice input"}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
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

      {/* Auto-routing indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
        <Zap className="h-3.5 w-3.5 text-primary/60" />
        <span>Auto-routing enabled — best model selected for each query</span>
      </div>
    </div>
  );
}
