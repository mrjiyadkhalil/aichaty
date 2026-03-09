import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Brain, Trash2, Plus } from "lucide-react";

interface Memory { id: string; fact: string; created_at: string; }

export function MemoryManager() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFact, setNewFact] = useState("");
  const [memoryEnabled, setMemoryEnabled] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadMemories();
    loadMemoryPreference();
  }, [user]);

  const loadMemoryPreference = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_preferences")
      .select("memory_enabled")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) setMemoryEnabled((data as any).memory_enabled ?? true);
  };

  const toggleMemory = async (enabled: boolean) => {
    if (!user) return;
    setMemoryEnabled(enabled);
    await supabase
      .from("user_preferences")
      .upsert({ user_id: user.id, memory_enabled: enabled } as any, { onConflict: "user_id" });
    toast.success(enabled ? "Memory enabled" : "Memory disabled");
  };

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
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-medium">Memory</p>
            <p className="text-xs text-muted-foreground">
              {memoryEnabled ? "AI will use stored memories in conversations" : "AI will not use stored memories"}
            </p>
          </div>
        </div>
        <Switch checked={memoryEnabled} onCheckedChange={toggleMemory} />
      </div>

      {memoryEnabled && (
        <>
          {/* Add new memory */}
          <div className="flex gap-2">
            <Input
              value={newFact}
              onChange={(e) => setNewFact(e.target.value)}
              placeholder="Add a fact (e.g., 'I prefer Python')"
              className="bg-background/50 border-border/30"
              onKeyDown={(e) => e.key === "Enter" && addMemory()}
            />
            <Button size="sm" onClick={addMemory} disabled={!newFact.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Memory list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {!loading && memories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No memories stored yet. Add facts above or the AI will learn as you chat.
              </p>
            )}
            {memories.map((m) => (
              <div key={m.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/20 group">
                <p className="text-sm flex-1">{m.fact}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMemory(m.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
