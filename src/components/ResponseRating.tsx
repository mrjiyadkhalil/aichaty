import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ResponseRatingProps {
  responseId: string;
}

export function ResponseRating({ responseId }: ResponseRatingProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState<-1 | 1 | null>(null);

  useEffect(() => {
    if (!user || !responseId) return;
    supabase.from("response_ratings").select("rating").eq("user_id", user.id).eq("response_id", responseId).maybeSingle().then(({ data }) => {
      if (data) setRating(data.rating as -1 | 1);
    });
  }, [user, responseId]);

  const handleRate = async (value: -1 | 1) => {
    if (!user) return;
    if (rating === value) {
      // Remove rating
      await supabase.from("response_ratings").delete().eq("user_id", user.id).eq("response_id", responseId);
      setRating(null);
      return;
    }
    const { error } = await supabase.from("response_ratings").upsert({ user_id: user.id, response_id: responseId, rating: value }, { onConflict: "user_id,response_id" });
    if (error) toast.error("Failed to rate");
    else setRating(value);
  };

  return (
    <div className="flex items-center gap-0.5">
      <Button variant="ghost" size="icon" className={`h-7 w-7 ${rating === 1 ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`} onClick={() => handleRate(1)} title="Thumbs up">
        <ThumbsUp className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className={`h-7 w-7 ${rating === -1 ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`} onClick={() => handleRate(-1)} title="Thumbs down">
        <ThumbsDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
