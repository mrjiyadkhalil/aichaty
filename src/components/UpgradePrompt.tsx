import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Crown, Sparkles } from "lucide-react";

interface UpgradePromptProps {
  open: boolean;
  onClose: () => void;
  feature: string;
  requiredPlan?: "pro";
}

export function UpgradePrompt({ open, onClose, feature, requiredPlan = "pro" }: UpgradePromptProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Upgrade Required
          </DialogTitle>
          <DialogDescription>
            <strong>{feature}</strong> is available on the{" "}
            <span className="text-primary font-semibold capitalize">{requiredPlan}</span> plan.
            Upgrade to unlock this feature and more.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <Sparkles className="h-8 w-8 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium">Pro Plan — $12/mo</p>
            <p className="text-xs text-muted-foreground">
              Unlimited messages, all models, file uploads, and more.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Maybe Later</Button>
          <Button onClick={() => { onClose(); navigate("/pricing"); }} className="gap-1.5 shadow-glow-sm">
            <Crown className="h-4 w-4" /> View Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
