import { useState } from "react";
import { Copy, Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function SynthesisPanel({ messageId, prompt, responses, existingSynthesis, onSynthesized }: SynthesisPanelProps) {
  const { user } = useAuth();
  const [synthesizing, setSynthesizing] = useState(false);
  const [content, setContent] = useState(existingSynthesis);
  const [copied, setCopied] = useState(false);
  const includedResponses = responses.filter((r) => r.included && r.content);

  const handleSynthesize = async () => {
    if (includedResponses.length === 0) { toast.warning("Include at least one model response"); return; }
    setSynthesizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("synthesize", {
        body: { prompt, responses: includedResponses.map((r) => ({ model: r.model, content: r.content })) },
      });
      if (error) throw error;
      const result = data?.content || "Synthesis failed";
      setContent(result);
      onSynthesized(result);
      if (user) {
        await supabase.from("synthesis_results").upsert({
          message_id: messageId, user_id: user.id, content: result,
          source_models: includedResponses.map((r) => r.model),
        }, { onConflict: "message_id" });
      }
    } catch (e: any) { toast.error(e.message || "Synthesis failed"); }
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
    a.href = url; a.download = "synthesis.md"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card overflow-hidden glow-border-strong animate-fade-in">
      <div className="py-3 px-4 flex items-center justify-between border-b border-primary/20 bg-primary/5">
        <h3 className="text-sm font-semibold font-['Space_Grotesk'] flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-primary">Best Final Answer</span>
        </h3>
        <div className="flex items-center gap-1">
          {content && (
            <>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={handleCopy}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={handleExport}>
                Export
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={handleSynthesize} disabled={synthesizing}>
                <RefreshCw className="h-3 w-3" /> Regenerate
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="p-4">
        {content ? (
          <div className="prose-dark text-sm leading-relaxed whitespace-pre-wrap">{content}</div>
        ) : (
          <div className="text-center py-6">
            <Button onClick={handleSynthesize} disabled={synthesizing || includedResponses.length === 0} className="gap-2 shadow-glow hover:shadow-glow-lg transition-shadow">
              {synthesizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Synthesize Best Answer
            </Button>
            {includedResponses.length === 0 && (
              <p className="text-xs text-muted-foreground mt-3">Toggle "Include in Final Answer" on model cards first</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
