import { useSessions, UserSession } from "@/hooks/useSessions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, Tablet, Trash2, ShieldAlert, Loader2 } from "lucide-react";

function getDeviceIcon(device: string | null) {
  if (device === "Mobile") return Smartphone;
  if (device === "Tablet") return Tablet;
  return Monitor;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SessionManager() {
  const { sessions, loading, revokeSession, revokeAllOther } = useSessions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const otherSessions = sessions.filter((s) => !s.is_current);

  return (
    <div className="space-y-4">
      {otherSessions.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={revokeAllOther} className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
            <ShieldAlert className="h-3.5 w-3.5" /> Revoke All Other Sessions
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {sessions.map((session) => {
          const Icon = getDeviceIcon(session.device_name);
          return (
            <div
              key={session.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                session.is_current ? "border-primary/30 bg-primary/5" : "border-border/30 bg-background/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${session.is_current ? "bg-primary/10" : "bg-muted/50"}`}>
                  <Icon className={`h-4 w-4 ${session.is_current ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {session.browser || "Unknown"} on {session.os || "Unknown"}
                    </span>
                    {session.is_current && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">This device</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{session.device_name || "Desktop"}</span>
                    {session.location && <><span>•</span><span>{session.location}</span></>}
                    <span>•</span>
                    <span>{timeAgo(session.last_active)}</span>
                  </div>
                </div>
              </div>

              {!session.is_current && (
                <Button variant="ghost" size="icon" onClick={() => revokeSession(session.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        })}

        {sessions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No active sessions found.</p>
        )}
      </div>
    </div>
  );
}
