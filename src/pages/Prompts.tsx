import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Copy, Search, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserPrompt {
  id: string; title: string; content: string; tags: string[]; use_count: number; created_at: string;
}

export default function Prompts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<UserPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    loadPrompts();
  }, [user]);

  const loadPrompts = async () => {
    if (!user) return;
    const { data } = await supabase.from("user_prompts").select("*").eq("user_id", user.id).order("use_count", { ascending: false });
    setPrompts((data as UserPrompt[]) || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !title.trim() || !content.trim()) return;
    const { error } = await supabase.from("user_prompts").insert({ user_id: user.id, title: title.trim(), content: content.trim(), tags });
    if (error) toast.error("Failed to save prompt");
    else { toast.success("Prompt saved!"); setShowCreate(false); setTitle(""); setContent(""); setTags([]); loadPrompts(); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("user_prompts").delete().eq("id", id);
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Prompt deleted");
  };

  const handleUse = async (prompt: UserPrompt) => {
    await navigator.clipboard.writeText(prompt.content);
    await supabase.from("user_prompts").update({ use_count: prompt.use_count + 1 }).eq("id", prompt.id);
    toast.success("Prompt copied! Paste it in chat.");
    navigate("/chat");
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const filtered = prompts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.content.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-['Space_Grotesk'] flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary" /> Prompt Library
        </h1>
        <Button onClick={() => setShowCreate(true)} className="gap-1.5 shadow-glow-sm">
          <Plus className="h-4 w-4" /> New Prompt
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search prompts..." className="pl-10 bg-background/50 border-border/30" />
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}

      <div className="grid gap-3">
        {filtered.map((p) => (
          <div key={p.id} className="glass-card p-4 space-y-2 group">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold font-['Space_Grotesk']">{p.title}</h3>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleUse(p)} title="Use prompt">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p.id)} title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{p.content}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {p.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs bg-secondary/50">{t}</Badge>
              ))}
              <span className="text-xs text-muted-foreground ml-auto">Used {p.use_count}x</span>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No prompts yet. Save your favorite prompts for quick reuse.</p>
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-['Space_Grotesk']">Save New Prompt</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Prompt title" className="bg-background/50 border-border/30" />
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Prompt content..." rows={4} className="bg-background/50 border-border/30" />
            <div className="flex gap-2">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag" className="bg-background/50 border-border/30" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
              <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => setTags(tags.filter((x) => x !== t))}>{t} ×</Badge>
                ))}
              </div>
            )}
            <Button onClick={handleCreate} disabled={!title.trim() || !content.trim()} className="w-full shadow-glow-sm">Save Prompt</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
