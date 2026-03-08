import { SunMoon, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ExportMenu } from "@/components/ExportMenu";

interface TopBarProps {
  title: string;
  layout?: "grid" | "stacked";
  onToggleLayout?: () => void;
  onToggleTheme: () => void;
  exportMessages?: { content: string; responses: { model: string; content: string | null; status: string }[]; synthesis?: string | null }[];
  projectName?: string;
}

export function TopBar({ title, layout, onToggleLayout, onToggleTheme, exportMessages, projectName }: TopBarProps) {
  return (
    <header className="h-14 border-b border-border flex items-center gap-3 px-4 bg-card/50 backdrop-blur-sm shrink-0">
      <SidebarTrigger />
      <h2 className="font-semibold text-sm truncate font-['Space_Grotesk'] flex-1">{title}</h2>

      <div className="flex items-center gap-1">
        {onToggleLayout && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleLayout} title={layout === "grid" ? "Stacked view" : "Grid view"}>
            {layout === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
        )}
        {exportMessages && projectName && (
          <ExportMenu messages={exportMessages} projectName={projectName} />
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleTheme}>
          <SunMoon className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
