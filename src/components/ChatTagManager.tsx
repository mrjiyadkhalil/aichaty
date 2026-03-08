import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag, Plus, X, Palette } from "lucide-react";
import { toast } from "sonner";

interface ChatTag {
  id: string;
  name: string;
  color: string;
}

const TAG_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#6366f1", "#f43f5e",
];

interface ChatTagManagerProps {
  chatId: string;
  compact?: boolean;
}

export function ChatTagManager({ chatId, compact }: ChatTagManagerProps) {
  const { user } = useAuth();
  const [tags, setTags] = useState<ChatTag[]>([]);
  const [assignedTagIds, setAssignedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[4]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("chat_tags").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) setTags(data as ChatTag[]);
    });
    supabase.from("chat_tag_assignments").select("tag_id").eq("chat_id", chatId).then(({ data }) => {
      if (data) setAssignedTagIds(data.map((d: any) => d.tag_id));
    });
  }, [user, chatId]);

  const createTag = async () => {
    if (!user || !newTagName.trim()) return;
    const { data, error } = await supabase.from("chat_tags").insert({ user_id: user.id, name: newTagName.trim(), color: newTagColor }).select().single();
    if (error) { toast.error("Failed to create tag"); return; }
    if (data) { setTags((prev) => [...prev, data as ChatTag]); setNewTagName(""); }
  };

  const toggleTag = async (tagId: string) => {
    if (!user) return;
    if (assignedTagIds.includes(tagId)) {
      await supabase.from("chat_tag_assignments").delete().eq("chat_id", chatId).eq("tag_id", tagId);
      setAssignedTagIds((prev) => prev.filter((id) => id !== tagId));
    } else {
      await supabase.from("chat_tag_assignments").insert({ chat_id: chatId, tag_id: tagId, user_id: user.id });
      setAssignedTagIds((prev) => [...prev, tagId]);
    }
  };

  const deleteTag = async (tagId: string) => {
    await supabase.from("chat_tags").delete().eq("id", tagId);
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    setAssignedTagIds((prev) => prev.filter((id) => id !== tagId));
  };

  const assignedTags = tags.filter((t) => assignedTagIds.includes(t.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs text-muted-foreground hover:text-foreground px-1.5">
          <Tag className="h-3 w-3" />
          {!compact && assignedTags.length > 0 && (
            <span className="flex gap-0.5">
              {assignedTags.slice(0, 2).map((t) => (
                <span key={t.id} className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: t.color }} />
              ))}
              {assignedTags.length > 2 && <span>+{assignedTags.length - 2}</span>}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-3" align="start">
        <p className="text-xs font-semibold text-muted-foreground font-['Space_Grotesk']">Chat Tags</p>
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-2 group">
              <button onClick={() => toggleTag(tag.id)} className="flex items-center gap-2 flex-1 text-left text-sm hover:bg-muted/30 rounded px-1.5 py-1 transition-colors">
                <span className="h-3 w-3 rounded-full shrink-0 border border-border/50" style={{ backgroundColor: tag.color, opacity: assignedTagIds.includes(tag.id) ? 1 : 0.3 }} />
                <span className={assignedTagIds.includes(tag.id) ? "text-foreground" : "text-muted-foreground"}>{tag.name}</span>
              </button>
              <button onClick={() => deleteTag(tag.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {tags.length === 0 && <p className="text-xs text-muted-foreground">No tags yet</p>}
        </div>
        <div className="flex items-center gap-1.5 border-t border-border/30 pt-2">
          <div className="flex gap-1">
            {TAG_COLORS.slice(0, 5).map((c) => (
              <button key={c} onClick={() => setNewTagColor(c)} className="h-4 w-4 rounded-full border transition-transform" style={{ backgroundColor: c, borderColor: newTagColor === c ? "hsl(var(--foreground))" : "transparent", transform: newTagColor === c ? "scale(1.2)" : "scale(1)" }} />
            ))}
          </div>
          <Input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="New tag" className="h-7 text-xs flex-1 bg-background/50 border-border/30" onKeyDown={(e) => e.key === "Enter" && createTag()} />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={createTag} disabled={!newTagName.trim()}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Inline tag badges component for display in sidebar
export function ChatTagBadges({ chatId }: { chatId: string }) {
  const { user } = useAuth();
  const [assignedTags, setAssignedTags] = useState<ChatTag[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: assignments } = await supabase.from("chat_tag_assignments").select("tag_id").eq("chat_id", chatId);
      if (!assignments?.length) return;
      const tagIds = assignments.map((a: any) => a.tag_id);
      const { data: tags } = await supabase.from("chat_tags").select("*").in("id", tagIds);
      if (tags) setAssignedTags(tags as ChatTag[]);
    };
    load();
  }, [user, chatId]);

  if (assignedTags.length === 0) return null;
  return (
    <span className="flex gap-0.5 ml-1">
      {assignedTags.slice(0, 3).map((t) => (
        <span key={t.id} className="h-1.5 w-1.5 rounded-full inline-block" style={{ backgroundColor: t.color }} title={t.name} />
      ))}
    </span>
  );
}
