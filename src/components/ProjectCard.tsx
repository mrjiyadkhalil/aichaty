import { FolderOpen, Clock } from "lucide-react";
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
    <div
      className="glass-card cursor-pointer transition-all duration-300 hover:glow-border hover:-translate-y-1 group p-5 space-y-3"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:shadow-glow-sm transition-all">
          <FolderOpen className="h-4.5 w-4.5 text-primary" />
        </div>
        <h3 className="font-semibold text-sm truncate font-['Space_Grotesk']">{name}</h3>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{timeAgo}</span>
        </div>
        {chatCount !== undefined && (
          <Badge variant="secondary" className="text-xs bg-secondary/50">{chatCount} {chatCount === 1 ? "chat" : "chats"}</Badge>
        )}
      </div>
    </div>
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
