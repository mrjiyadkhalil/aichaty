import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Brain, Trash2, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Memory { id: string; fact: string; created_at: string; }

export function MemoryManager() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFact, setNewFact] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !open) return;
    loadMemories();
  }, [user, open]);

  const loadMemories = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("user_memories").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setMemories((data as Memory[]) || []);
    setLoading(false);
  };

  const addMemory = async () => {
    if (!user || !newFact.trim()) return;
    const { error } = await supabase.from("user_memories").insert({ user_id: user.id, fact: newFact.trim() });
    if (error) toast.error("Failed to save memory");
    else { toast.success("Memory saved"); setNewFact(""); loadMemories(); }
  };

  const deleteMemory = async (id: string) => {
    await supabase.from("user_memories").delete().eq("id", id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
    toast.success("Memory deleted");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5 border-border/50 hover:bg-secondary">
          <Brain className="h-3.5 w-3.5" /> Manage Memories
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-['Space_Grotesk']">
            <Brain className="h-5 w-5 text-primary" /> AI Memory
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Facts the AI remembers about you across conversations.</p>
        <div className="flex gap-2">
          <Input value={newFact} onChange={(e) => setNewFact(e.target.value)} placeholder="Add a fact (e.g., 'I prefer Python')" className="bg-background/50 border-border/30" onKeyDown={(e) => e.key === "Enter" && addMemory()} />
          <Button size="sm" onClick={addMemory} disabled={!newFact.trim()}><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="max-h-[300px] overflow-y-auto space-y-2 mt-2">
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {!loading && memories.length === 0 && <p className="text-sm text-muted-foreground">No memories stored yet. The AI will learn as you chat.</p>}
          {memories.map((m) => (
            <div key={m.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/20 group">
              <p className="text-sm flex-1">{m.fact}</p>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => deleteMemory(m.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
