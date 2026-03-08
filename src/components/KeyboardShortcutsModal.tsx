import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ["Ctrl", "Enter"], description: "Send message" },
  { keys: ["Ctrl", "K"], description: "New chat" },
  { keys: ["Ctrl", "/"], description: "Show keyboard shortcuts" },
  { keys: ["Shift", "Enter"], description: "New line in prompt" },
];

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-['Space_Grotesk']">
            <Keyboard className="h-5 w-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key, j) => (
                  <span key={j}>
                    {j > 0 && <span className="text-muted-foreground mx-0.5">+</span>}
                    <kbd className="px-2 py-1 text-xs font-mono rounded bg-muted/50 border border-border/50 text-foreground">
                      {key}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Use ⌘ instead of Ctrl on Mac</p>
      </DialogContent>
    </Dialog>
  );
}
