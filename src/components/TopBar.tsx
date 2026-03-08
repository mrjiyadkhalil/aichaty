import { Settings, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const AVAILABLE_MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", short: "G3F" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", short: "G2.5F" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", short: "G2.5P" },
  { id: "openai/gpt-5", label: "GPT-5", short: "GPT5" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", short: "GPT5m" },
  { id: "openai/gpt-5-nano", label: "GPT-5 Nano", short: "GPT5n" },
];

interface TopBarProps {
  projectName: string | null;
  selectedModels: string[];
  onToggleModel: (modelId: string) => void;
  onToggleTheme: () => void;
}

export function TopBar({ projectName, selectedModels, onToggleModel, onToggleTheme }: TopBarProps) {
  return (
    <header className="h-14 border-b border-border flex items-center gap-3 px-4 bg-card/50 backdrop-blur-sm shrink-0">
      <SidebarTrigger />
      
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <h2 className="font-semibold text-sm truncate font-['Space_Grotesk']">
          {projectName || "Select a project"}
        </h2>
        
        <div className="hidden md:flex items-center gap-1.5 flex-wrap">
          {AVAILABLE_MODELS.map((model) => {
            const isSelected = selectedModels.includes(model.id);
            return (
              <Badge
                key={model.id}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer text-xs transition-all hover:scale-105 select-none"
                onClick={() => onToggleModel(model.id)}
              >
                {model.short}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleTheme}>
          <SunMoon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

export { AVAILABLE_MODELS };
