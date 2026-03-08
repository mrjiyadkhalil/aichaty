import { Zap, LayoutGrid } from "lucide-react";
import type { ChatMode } from "@/pages/ChatWorkspace";

interface ChatModeSwitcherProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export function ChatModeSwitcher({ mode, onModeChange }: ChatModeSwitcherProps) {
  return (
    <div className="inline-flex items-center rounded-full p-1 bg-card/80 backdrop-blur-xl border border-border/40 shadow-glow-sm">
      <button
        onClick={() => onModeChange("superfiesta")}
        className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
          mode === "superfiesta"
            ? "bg-primary text-primary-foreground shadow-glow"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Zap className="h-4 w-4" />
        SuperFiesta
      </button>
      <button
        onClick={() => onModeChange("multichat")}
        className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
          mode === "multichat"
            ? "bg-primary text-primary-foreground shadow-glow"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
        Multi-Chat
      </button>
    </div>
  );
}
