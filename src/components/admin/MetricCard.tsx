import { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
}

export function MetricCard({ label, value, icon, subtitle }: MetricCardProps) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold font-['Space_Grotesk'] text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {icon && <div className="text-primary/60">{icon}</div>}
      </div>
    </div>
  );
}
