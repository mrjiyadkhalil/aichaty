import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { MetricCard } from "@/components/admin/MetricCard";
import { ArrowLeft, Shield, ShieldOff, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi("get_user_detail", { target_user_id: id })
      .then(setDetail)
      .catch(() => toast.error("Failed to load user"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleAction = async (action: string, params: Record<string, unknown> = {}) => {
    setActing(true);
    try {
      await adminApi(action, { target_user_id: id, ...params });
      toast.success("Action completed");
      load();
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    }
    setActing(false);
  };

  if (loading || !detail) {
    return <div className="p-6"><div className="h-64 animate-pulse bg-muted rounded-lg" /></div>;
  }

  const isAdmin = detail.roles?.includes("admin");
  const isSuspended = detail.profile?.status === "suspended";

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk']">{detail.profile?.display_name || "User"}</h1>
          <p className="text-sm text-muted-foreground">{detail.profile?.user_id}</p>
        </div>
        <div className="flex gap-2">
          {detail.roles?.map((r: string) => <StatusBadge key={r} status={r} />)}
          <StatusBadge status={detail.profile?.status || "active"} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Projects" value={detail.project_count} />
        <MetricCard label="Chats" value={detail.chat_count} />
        <MetricCard label="Total Cost" value={`$${detail.total_cost}`} />
        <MetricCard label="Cost Mode" value={detail.preferences?.cost_mode || "balanced"} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Admin Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {isAdmin ? (
            <Button variant="outline" size="sm" disabled={acting} onClick={() => handleAction("update_user_role", { role: "admin", grant: false })} className="gap-1.5">
              <ShieldOff className="h-4 w-4" /> Remove Admin
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled={acting} onClick={() => handleAction("update_user_role", { role: "admin", grant: true })} className="gap-1.5">
              <Shield className="h-4 w-4" /> Make Admin
            </Button>
          )}
          {isSuspended ? (
            <Button variant="outline" size="sm" disabled={acting} onClick={() => handleAction("reactivate_user")} className="gap-1.5">
              <CheckCircle className="h-4 w-4" /> Reactivate
            </Button>
          ) : (
            <Button variant="destructive" size="sm" disabled={acting} onClick={() => handleAction("suspend_user")} className="gap-1.5">
              <Ban className="h-4 w-4" /> Suspend
            </Button>
          )}
        </CardContent>
      </Card>

      {detail.recent_usage?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-64 overflow-auto">
              {detail.recent_usage.map((u: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{u.model}</span>
                  <span className="text-muted-foreground">{u.request_type}</span>
                  <span className={u.status === "error" ? "text-destructive" : "text-muted-foreground"}>{u.status}</span>
                  <span className="text-muted-foreground">${Number(u.estimated_cost || 0).toFixed(4)}</span>
                  <span className="text-muted-foreground">{new Date(u.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
