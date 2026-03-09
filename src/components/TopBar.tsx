import { SidebarTrigger } from "@/components/ui/sidebar";
import { ExportMenu } from "@/components/ExportMenu";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Settings, Plus } from "lucide-react";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface TopBarProps {
  title: string;
  layout?: "grid" | "stacked";
  onToggleLayout?: () => void;
  exportMessages?: { content: string; responses: { model: string; content: string | null; status: string }[]; synthesis?: string | null }[];
  projectName?: string;
}

export function TopBar({ title, layout, onToggleLayout, exportMessages, projectName }: TopBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="h-12 border-b border-border flex items-center gap-2 md:gap-3 px-2 md:px-3 bg-background shrink-0 flex-1">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors duration-150 h-9 w-9 min-w-[36px] min-h-[36px]" />
      <h2 className="font-medium text-sm truncate flex-1 text-foreground/80">{title}</h2>
      <div className="flex items-center gap-1">
        {onToggleLayout && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleLayout}
            className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors"
            title={layout === "grid" ? "Switch to stacked view" : "Switch to grid view"}
          >
            {layout === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
        )}
        {exportMessages && projectName && (
          <ExportMenu messages={exportMessages} projectName={projectName} />
        )}
        
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      </div>
    </header>
  );
}
