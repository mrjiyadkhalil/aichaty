import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Bookmark, Trash2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { AI_CONFIG } from "@/lib/aiConfig";
import { motion } from "framer-motion";

interface BookmarkRow {
  id: string;
  response_id: string;
  note: string | null;
  created_at: string;
  response?: {
    id: string;
    model: string;
    content: string | null;
    message_id: string;
    message?: { chat_id: string; content: string };
  };
}

export default function Bookmarks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<BookmarkRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!data) { setLoading(false); return; }

      // Load response details for each bookmark
      const enriched: BookmarkRow[] = [];
      for (const bm of data) {
        const { data: resp } = await supabase
          .from("model_responses")
          .select("id, model, content, message_id")
          .eq("id", bm.response_id)
          .single();
        if (resp) {
          const { data: msg } = await supabase
            .from("messages")
            .select("chat_id, content")
            .eq("id", resp.message_id)
            .single();
          enriched.push({ ...bm, response: { ...resp, message: msg || undefined } } as any);
        }
      }
      setBookmarks(enriched);
      setLoading(false);
    };
    load();
  }, [user]);

  const removeBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    toast.success("Bookmark removed");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Bookmark className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold font-['Space_Grotesk']">Bookmarks</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bookmark className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No bookmarks yet. Click the bookmark icon on any model response to save it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bm, i) => (
            <motion.div key={bm.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Bookmark className="h-4 w-4 text-primary" />
                  <span className="font-semibold font-['Space_Grotesk']">{AI_CONFIG.modelLabels[bm.response?.model || ""] || bm.response?.model}</span>
                  <span className="text-xs text-muted-foreground">· {new Date(bm.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  {bm.response?.message && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => navigate(`/chat/${bm.response?.message?.chat_id}`)}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeBookmark(bm.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {bm.response?.message && (
                <div className="px-4 py-2 bg-muted/10 border-b border-border/20">
                  <p className="text-xs text-muted-foreground">Prompt: <span className="text-foreground/80">{bm.response.message.content.slice(0, 120)}{bm.response.message.content.length > 120 ? "..." : ""}</span></p>
                </div>
              )}
              <div className="p-4 prose-dark text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown>{bm.response?.content || ""}</ReactMarkdown>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
