import { FolderOpen, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  name: string;
  description: string | null;
  updatedAt: string;
  chatCount?: number;
  onClick: () => void;
}

export function ProjectCard({ name, description, updatedAt, chatCount, onClick }: ProjectCardProps) {
  const timeAgo = getTimeAgo(updatedAt);

  return (
    <Card
      className="cursor-pointer border-border/50 transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 group"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 font-['Space_Grotesk']">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <FolderOpen className="h-4 w-4 text-primary" />
          </div>
          <span className="truncate">{name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
          {chatCount !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {chatCount} {chatCount === 1 ? "chat" : "chats"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
