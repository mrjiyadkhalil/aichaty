import { useState } from "react";
import { Copy, Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SynthesisPanelProps {
  messageId: string;
  prompt: string;
  responses: { model: string; content: string; included: boolean }[];
  existingSynthesis: string | null;
  onSynthesized: (content: string) => void;
}

export function SynthesisPanel({
  messageId,
  prompt,
  responses,
  existingSynthesis,
  onSynthesized,
}: SynthesisPanelProps) {
  const { user } = useAuth();
  const [synthesizing, setSynthesizing] = useState(false);
  const [content, setContent] = useState(existingSynthesis);
  const [copied, setCopied] = useState(false);

  const includedResponses = responses.filter((r) => r.included && r.content);

  const handleSynthesize = async () => {
    if (includedResponses.length === 0) {
      toast.warning("Include at least one model response");
      return;
    }
    setSynthesizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("synthesize", {
        body: {
          prompt,
          responses: includedResponses.map((r) => ({ model: r.model, content: r.content })),
        },
      });
      if (error) throw error;
      const result = data?.content || "Synthesis failed";
      setContent(result);
      onSynthesized(result);

      // Save to DB
      if (user) {
        await supabase.from("synthesis_results").upsert({
          message_id: messageId,
          user_id: user.id,
          content: result,
          source_models: includedResponses.map((r) => r.model),
        }, { onConflict: "message_id" });
      }
    } catch (e: any) {
      toast.error(e.message || "Synthesis failed");
    }
    setSynthesizing(false);
  };

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (!content) return;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "synthesis.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-accent/20">
        <h3 className="text-sm font-semibold font-['Space_Grotesk'] flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          Best Final Answer
        </h3>
        <div className="flex items-center gap-1">
          {content && (
            <>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleCopy}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy Final
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleExport}>
                Export Final
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleSynthesize} disabled={synthesizing}>
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {content ? (
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap text-sm leading-relaxed">
            {content}
          </div>
        ) : (
          <div className="text-center py-4">
            <Button
              onClick={handleSynthesize}
              disabled={synthesizing || includedResponses.length === 0}
              className="gap-2"
            >
              {synthesizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Synthesize Best Answer
            </Button>
            {includedResponses.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">Toggle "Include in Final Answer" on model cards first</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
