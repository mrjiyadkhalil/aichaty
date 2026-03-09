import { useState } from "react";
import { Send, Plus, Mic, MicOff, Sparkles, Globe } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { ImageUploadButton } from "@/components/ImageUploadButton";
import { cn } from "@/lib/utils";

interface SuperFiestaViewProps {
  onSend: (prompt: string) => void;
  onEnhance: (prompt: string) => void;
  onAttachFiles?: () => void;
  disabled: boolean;
  enhancing: boolean;
  showGreeting?: boolean;
  onImageSelected?: (base64: string, mimeType: string) => void;
  onImageRemoved?: () => void;
  hasImage?: boolean;
}

export function SuperFiestaView({
  onSend, onEnhance, onAttachFiles, disabled, enhancing, showGreeting = true,
  onImageSelected, onImageRemoved, hasImage = false,
}: SuperFiestaViewProps) {
  const [prompt, setPrompt] = useState("");

  const { isRecording, toggleRecording, voiceLang, setVoiceLang } = useVoiceInput((text) => {
    setPrompt((prev) => (prev ? prev + " " + text : text));
  });

  const VOICE_LANGS = [
    { code: "bn-BD", label: "বাংলা" },
    { code: "en-US", label: "English" },
    { code: "hi-IN", label: "हिन्दी" },
    { code: "ar-SA", label: "العربية" },
  ];
  const currentLangLabel = VOICE_LANGS.find(l => l.code === voiceLang)?.label || voiceLang;

  const handleSend = () => {
    if (!prompt.trim() || disabled) return;
    onSend(prompt.trim());
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto">
      {showGreeting && (
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            What can I help with?
          </h1>
        </div>
      )}

      {/* Floating input */}
      <div className="w-full relative">
        <div className="relative bg-card border border-border rounded-2xl transition-all duration-200 focus-within:border-muted-foreground/30 focus-within:shadow-lg">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Fiesta AI..."
            rows={1}
            className="w-full bg-transparent border-none outline-none resize-none text-sm placeholder:text-muted-foreground/50 px-4 pt-3.5 pb-12 min-h-[52px] max-h-[180px]"
            disabled={disabled}
            style={{ fieldSizing: "content" } as any}
          />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              {onAttachFiles && (
                <button onClick={onAttachFiles} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150" disabled={disabled}>
                  <Plus className="h-4 w-4" />
                </button>
              )}
              {onImageSelected && onImageRemoved && (
                <ImageUploadButton onImageSelected={onImageSelected} onImageRemoved={onImageRemoved} hasImage={hasImage} disabled={disabled} />
              )}
              <button onClick={toggleRecording} disabled={disabled} className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-colors duration-150", isRecording ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <button onClick={() => onEnhance(prompt)} disabled={!prompt.trim() || enhancing || disabled} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 disabled:opacity-30">
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!prompt.trim() || disabled}
              className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center text-background transition-all duration-150 disabled:opacity-20"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/50">
        Fiesta AI auto-selects the best model for each query
      </p>
    </div>
  );
}
