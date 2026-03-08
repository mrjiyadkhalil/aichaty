import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  suspended: { label: "Suspended", variant: "destructive" },
  admin: { label: "Admin", variant: "secondary" },
  user: { label: "User", variant: "outline" },
  error: { label: "Error", variant: "destructive" },
  warning: { label: "Warning", variant: "secondary" },
  info: { label: "Info", variant: "outline" },
  resolved: { label: "Resolved", variant: "default" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
