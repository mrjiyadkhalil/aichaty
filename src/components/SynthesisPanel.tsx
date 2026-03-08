import { useState } from "react";
import { Copy, Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";

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

  return (
    <div className="bg-card rounded-xl overflow-hidden animate-fade-in relative border-2 border-transparent bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 bg-clip-padding shadow-lg shadow-primary/10">
      <div className="py-2.5 px-4 flex items-center justify-between border-b border-border/50 bg-card/95 backdrop-blur-sm">
        <h3 className="text-[13px] font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          Best Final Answer
        </h3>
        <div className="flex items-center gap-1">
          {content && (
            <>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground transition-colors duration-150" onClick={handleCopy}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground transition-colors duration-150" onClick={handleSynthesize} disabled={synthesizing}>
                <RefreshCw className="h-3 w-3" /> Redo
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="p-4">
        {content ? (
          <div className="prose-dark">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-6">
            <Button onClick={handleSynthesize} disabled={synthesizing || includedResponses.length === 0} variant="outline" className="gap-2 border-border hover:bg-muted transition-colors duration-150">
              {synthesizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Synthesize Best Answer
            </Button>
            {includedResponses.length === 0 && (
              <p className="text-xs text-muted-foreground mt-3">Toggle "Include" on model cards first</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
