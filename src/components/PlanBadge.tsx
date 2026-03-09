import { Badge } from "@/components/ui/badge";
import { Crown, Building2, Zap } from "lucide-react";
import { PlanName } from "@/hooks/useSubscription";

const PLAN_CONFIG: Record<PlanName, { icon: any; label: string; className: string }> = {
  free: { icon: Zap, label: "Free", className: "bg-muted text-muted-foreground" },
  pro: { icon: Crown, label: "Pro", className: "bg-primary/10 text-primary border-primary/30" },
};

export function PlanBadge({ plan }: { plan: PlanName }) {
  const config = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
