import { Zap, LayoutGrid } from "lucide-react";
import type { ChatMode } from "@/pages/ChatWorkspace";

interface ChatModeSwitcherProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export function ChatModeSwitcher({ mode, onModeChange }: ChatModeSwitcherProps) {
  return (
    <div className="inline-flex items-center rounded-full p-0.5 bg-muted/50 border border-border">
      <button
        onClick={() => onModeChange("superfiesta")}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
          mode === "superfiesta"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Zap className="h-3.5 w-3.5" />
        SuperFiesta
      </button>
      <button
        onClick={() => onModeChange("multichat")}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
          mode === "multichat"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Multi-Chat
      </button>
    </div>
  );
}
