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
};

const colorVars = ["--model-1", "--model-2", "--model-3", "--model-4", "--model-5"];

export function ModelResponseCard({
  model, content, status, errorMessage, includedInSynthesis,
  onToggleInclude, onRetry, latencyMs, colorIndex, responseId,
}: ModelResponseCardProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const colorVar = colorVars[colorIndex % colorVars.length];

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
    <div
      className="glass-card overflow-hidden transition-all duration-300 hover:shadow-glow animate-fade-in"
      style={{ borderTopColor: `hsl(var(${colorVar}))`, borderTopWidth: "2px" }}
    >
      <div className="py-3 px-4 flex items-center justify-between border-b border-border/30">
        <div className="flex items-center gap-2 text-sm font-semibold font-['Space_Grotesk']">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `hsl(var(${colorVar}))` }} />
          {MODEL_LABELS[model] || model}
          {latencyMs != null && status === "success" && (
            <span className="text-xs font-normal text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {(latencyMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {status === "success" && (
            <>
              {responseId && <ResponseRating responseId={responseId} />}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleCopy} title="Copy">
                {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className={`h-7 w-7 ${bookmarked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} onClick={handleBookmark} title="Bookmark">
                {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleInclude} title="Include in Final Answer">
                {includedInSynthesis ? (
                  <ToggleRight className="h-4 w-4 text-primary" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </>
          )}
          {status === "error" && onRetry && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={onRetry}>
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          )}
        </div>
      </div>
      <div className="p-4">
        {status === "loading" && (
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-full bg-muted/50" />
            <Skeleton className="h-4 w-4/5 bg-muted/50" />
            <Skeleton className="h-4 w-3/5 bg-muted/50" />
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage || "Failed to generate response"}</span>
          </div>
        )}
        {status === "success" && content && (
          <div className="prose-dark text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
