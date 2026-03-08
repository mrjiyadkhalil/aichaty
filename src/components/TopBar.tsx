import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ExportMenu } from "@/components/ExportMenu";

interface TopBarProps {
  title: string;
  layout?: "grid" | "stacked";
  onToggleLayout?: () => void;
  exportMessages?: { content: string; responses: { model: string; content: string | null; status: string }[]; synthesis?: string | null }[];
  projectName?: string;
}

export function TopBar({ title, layout, onToggleLayout, exportMessages, projectName }: TopBarProps) {
  return (
    <header className="h-14 border-b border-border/30 flex items-center gap-3 px-4 bg-card/30 backdrop-blur-xl shrink-0">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      <h2 className="font-semibold text-sm truncate font-['Space_Grotesk'] flex-1 text-foreground/90">{title}</h2>

      <div className="flex items-center gap-1">
        {exportMessages && projectName && (
          <ExportMenu messages={exportMessages} projectName={projectName} />
        )}
      </div>
    </header>
  );
}
