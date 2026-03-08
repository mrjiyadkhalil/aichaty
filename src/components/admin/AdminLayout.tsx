import { ReactNode, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, BarChart3, Cpu, Settings2, AlertTriangle,
  ClipboardList, ArrowLeft, Flag, FileText, Link2, Megaphone, HeartPulse,
  DollarSign, Radio, UserCog, ChevronRight, Home,
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

function AdminBreadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();

  const crumbs = useMemo(() => {
    const current = NAV_ITEMS.find(
      (item) =>
        location.pathname === item.path ||
        (item.path !== "/admin" && location.pathname.startsWith(item.path))
    );

    // Check for detail pages like /admin/users/:id
    const segments = location.pathname.split("/").filter(Boolean);
    const isDetailPage = segments.length > 2 && current;

    const result: { label: string; path?: string; icon?: React.ElementType }[] = [
      { label: "Admin", path: "/admin", icon: Home },
    ];

    if (current && current.path !== "/admin") {
      if (isDetailPage) {
        result.push({ label: current.label, path: current.path, icon: current.icon });
        result.push({ label: "Detail" });
      } else {
        result.push({ label: current.label, icon: current.icon });
      }
    }

    return result;
  }, [location.pathname]);

  return (
    <nav className="flex items-center gap-1 text-sm px-6 py-3 border-b border-border/30">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        const Icon = crumb.icon;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 mx-0.5" />}
            {isLast ? (
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {crumb.label}
              </span>
            ) : (
              <button
                onClick={() => crumb.path && navigate(crumb.path)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {crumb.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}

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
        <div className="sticky bottom-0 p-3 border-t border-border/30 bg-card/50 backdrop-blur-xl">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-4 w-4" /> Back to App
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto flex flex-col">
        <AdminBreadcrumb />
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
