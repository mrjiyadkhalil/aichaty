import { useState } from "react";
import { Copy, Check, ToggleLeft, ToggleRight, AlertCircle, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

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
  onToggleInclude, onRetry, latencyMs, colorIndex,
}: ModelResponseCardProps) {
  const [copied, setCopied] = useState(false);
  const colorVar = colorVars[colorIndex % colorVars.length];

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden border-border/50 transition-shadow hover:shadow-md">
      <CardHeader
        className="py-3 px-4 flex flex-row items-center justify-between"
        style={{ borderBottom: `2px solid hsl(var(${colorVar}))` }}
      >
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `hsl(var(${colorVar}))` }} />
          {MODEL_LABELS[model] || model}
          {latencyMs != null && status === "success" && (
            <span className="text-xs font-normal text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {(latencyMs / 1000).toFixed(1)}s
            </span>
          )}
        </CardTitle>
        <div className="flex items-center gap-1">
          {status === "success" && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} title="Copy">
                {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleInclude} title="Include in Final Answer">
                {includedInSynthesis ? (
                  <ToggleRight className="h-4 w-4 text-accent" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </>
          )}
          {status === "error" && onRetry && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onRetry}>
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {status === "loading" && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage || "Failed to generate response"}</span>
          </div>
        )}
        {status === "success" && content && (
          <div className="prose prose-sm max-w-none text-foreground text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
