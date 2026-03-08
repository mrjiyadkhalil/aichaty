import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

interface PromptEnhancerModalProps {
  open: boolean; onClose: () => void; originalPrompt: string;
  enhancedPrompt: string | null; loading: boolean;
  onKeepOriginal: () => void; onUseEnhanced: (prompt: string) => void;
}

export function PromptEnhancerModal({ open, onClose, originalPrompt, enhancedPrompt, loading, onKeepOriginal, onUseEnhanced }: PromptEnhancerModalProps) {
  const [editedPrompt, setEditedPrompt] = useState(enhancedPrompt || "");
  const [editing, setEditing] = useState(false);

  useEffect(() => { if (enhancedPrompt) setEditedPrompt(enhancedPrompt); }, [enhancedPrompt]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto glass-card border-border/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-['Space_Grotesk']">
            <Sparkles className="h-5 w-5 text-primary" /> Prompt Enhancer
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Original Prompt</h3>
            <div className="p-3 rounded-lg bg-background/40 border border-border/30 text-sm min-h-[150px] whitespace-pre-wrap">{originalPrompt}</div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-primary">Enhanced Prompt</h3>
            {loading ? (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 min-h-[150px] space-y-2">
                <Skeleton className="h-4 w-full bg-primary/10" /><Skeleton className="h-4 w-4/5 bg-primary/10" /><Skeleton className="h-4 w-3/5 bg-primary/10" />
              </div>
            ) : editing ? (
              <Textarea value={editedPrompt} onChange={(e) => setEditedPrompt(e.target.value)} className="min-h-[150px] bg-primary/5 border-primary/20 focus:border-primary/40" />
            ) : (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm min-h-[150px] whitespace-pre-wrap">{editedPrompt || "Enhancing..."}</div>
            )}
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={onClose} className="border-border/50">Cancel</Button>
          <Button variant="outline" onClick={onKeepOriginal} className="border-border/50">Keep Original</Button>
          {!loading && !editing && <Button variant="outline" onClick={() => setEditing(true)} className="border-border/50">Edit Enhanced</Button>}
          {!loading && <Button onClick={() => onUseEnhanced(editedPrompt)} className="shadow-glow-sm">Use Enhanced</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
