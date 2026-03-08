import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PromptInputProps {
  onSend: (prompt: string) => void;
  onEnhance: (prompt: string) => void;
  disabled: boolean;
  enhancing: boolean;
}

export function PromptInput({ onSend, onEnhance, disabled, enhancing }: PromptInputProps) {
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... Compare responses across models."
            className="min-h-[80px] pr-32 resize-none bg-background/80 border-border/50 focus:border-primary/50"
            disabled={disabled}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-accent"
              onClick={() => onEnhance(prompt)}
              disabled={!prompt.trim() || enhancing}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Enhance
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1"
              onClick={handleSend}
              disabled={!prompt.trim() || disabled}
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}