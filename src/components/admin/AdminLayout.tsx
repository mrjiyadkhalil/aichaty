import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, BarChart3, Cpu, Settings2, AlertTriangle,
  ClipboardList, ArrowLeft, Flag, FileText, Link2, Megaphone, HeartPulse,
  DollarSign, Radio, UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Roles", path: "/admin/roles", icon: UserCog },
  { label: "Usage & Cost", path: "/admin/usage", icon: BarChart3 },
  { label: "Revenue", path: "/admin/revenue", icon: DollarSign },
  { label: "Models", path: "/admin/models", icon: Cpu },
  { label: "Broadcast", path: "/admin/broadcast", icon: Radio },
  { label: "Settings", path: "/admin/settings", icon: Settings2 },
  { label: "Feature Flags", path: "/admin/feature-flags", icon: Flag },
  { label: "Templates", path: "/admin/templates", icon: FileText },
  { label: "Share Links", path: "/admin/share-links", icon: Link2 },
  { label: "Announcements", path: "/admin/announcements", icon: Megaphone },
  { label: "Errors", path: "/admin/errors", icon: AlertTriangle },
  { label: "Audit Log", path: "/admin/audit", icon: ClipboardList },
  { label: "System Health", path: "/admin/health", icon: HeartPulse },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-56 border-r border-border/30 bg-card/50 backdrop-blur-xl flex flex-col shrink-0">
        <div className="p-4 border-b border-border/30">
          <h2 className="font-bold text-sm font-['Space_Grotesk'] text-foreground">Admin Panel</h2>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                  active ? "bg-primary/10 text-primary font-medium shadow-glow-sm" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/30">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" /> Back to App
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
