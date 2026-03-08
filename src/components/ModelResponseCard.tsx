import { useState } from "react";
import { Copy, Check, ToggleLeft, ToggleRight, AlertCircle, RefreshCw, Clock, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ResponseRating } from "@/components/ResponseRating";

interface ModelResponseCardProps {
  model: string;
  content: string | null;
  status: "loading" | "success" | "error";
  errorMessage?: string | null;
  includedInSynthesis: boolean;
  onToggleInclude: () => void;
  onRetry?: () => void;
  latencyMs?: number | null;
  colorIndex: number;
  responseId?: string;
}

const MODEL_LABELS: Record<string, string> = {
  "google/gemini-3-flash-preview": "Gemini 3 Flash",
  "google/gemini-2.5-flash": "Gemini 2.5 Flash",
  "google/gemini-2.5-pro": "Gemini 2.5 Pro",
  "openai/gpt-5": "GPT-5",
  "openai/gpt-5-mini": "GPT-5 Mini",
  "openai/gpt-5-nano": "GPT-5 Nano",
  "anthropic/claude-4-sonnet": "Claude 4 Sonnet",
  "anthropic/claude-4-haiku": "Claude 4 Haiku",
  "deepseek/deepseek-v3": "DeepSeek V3",
  "deepseek/deepseek-r1": "DeepSeek R1",
  "mistral/mistral-large": "Mistral Large",
  "mistral/codestral": "Codestral",
  "kimi/moonshot-v1": "Moonshot V1",
};

function getProviderClass(model: string): string {
  const provider = model.split("/")[0];
  const map: Record<string, string> = {
    google: "provider-border-google",
    openai: "provider-border-openai",
    anthropic: "provider-border-anthropic",
    deepseek: "provider-border-deepseek",
    mistral: "provider-border-mistral",
    kimi: "provider-border-kimi",
  };
  return map[provider] || "";
}

function getProviderLabel(model: string): string {
  const provider = model.split("/")[0];
  const map: Record<string, string> = {
    google: "Google",
    openai: "OpenAI",
    anthropic: "Anthropic",
    deepseek: "DeepSeek",
    mistral: "Mistral",
    kimi: "Kimi",
  };
  return map[provider] || provider;
}

export function ModelResponseCard({
  model, content, status, errorMessage, includedInSynthesis,
  onToggleInclude, onRetry, latencyMs, colorIndex, responseId,
}: ModelResponseCardProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookmark = async () => {
    if (!user || !responseId) return;
    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("response_id", responseId);
      setBookmarked(false);
      toast.success("Bookmark removed");
    } else {
      const { error } = await supabase.from("bookmarks").insert({ user_id: user.id, response_id: responseId });
      if (error) {
        if (error.code === "23505") { setBookmarked(true); toast.info("Already bookmarked"); }
        else toast.error("Failed to bookmark");
      } else {
        setBookmarked(true);
        toast.success("Bookmarked!");
      }
    }
  };

  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden transition-all duration-150 hover:border-border/80 animate-fade-in ${getProviderClass(model)}`}>
      {/* Header */}
      <div className="py-2.5 px-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-foreground">
            {MODEL_LABELS[model] || model}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            {getProviderLabel(model)}
          </span>
          {latencyMs != null && status === "success" && (
            <span className="text-[11px] text-muted-foreground/70 flex items-center gap-0.5 bg-muted/50 px-1.5 py-0.5 rounded">
              <Clock className="h-3 w-3" />
              {(latencyMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {status === "loading" && (
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-full bg-muted/40" />
            <Skeleton className="h-4 w-4/5 bg-muted/40" />
            <Skeleton className="h-4 w-3/5 bg-muted/40" />
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage || "Failed to generate response"}</span>
          </div>
        )}
        {status === "success" && content && (
          <div className="prose-dark">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {status === "success" && responseId && <ResponseRating responseId={responseId} />}
        </div>
        <div className="flex items-center gap-0.5">
          {status === "success" && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors duration-150" onClick={handleCopy} title="Copy">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className={`h-7 w-7 transition-colors duration-150 ${bookmarked ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`} onClick={handleBookmark} title="Bookmark">
                {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 transition-colors duration-150" onClick={onToggleInclude} title="Include in synthesis">
                {includedInSynthesis ? (
                  <ToggleRight className="h-4 w-4 text-foreground" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </>
          )}
          {status === "error" && onRetry && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground transition-colors duration-150" onClick={onRetry}>
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
