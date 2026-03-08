import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SavePromptButtonProps {
  promptContent: string;
}

export function SavePromptButton({ promptContent }: SavePromptButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const handleSave = async () => {
    if (!user || !title.trim()) return;
    const { error } = await supabase.from("user_prompts").insert({ user_id: user.id, title: title.trim(), content: promptContent });
    if (error) toast.error("Failed to save");
    else { toast.success("Saved to Prompt Library!"); setOpen(false); setTitle(""); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
          <BookOpen className="h-3 w-3" /> Save as Prompt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="font-['Space_Grotesk']">Save to Prompt Library</DialogTitle></DialogHeader>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give it a title" className="bg-background/50 border-border/30" onKeyDown={(e) => e.key === "Enter" && handleSave()} />
        <p className="text-xs text-muted-foreground line-clamp-3">{promptContent}</p>
        <Button onClick={handleSave} disabled={!title.trim()} className="shadow-glow-sm">Save</Button>
      </DialogContent>
    </Dialog>
  );
}
