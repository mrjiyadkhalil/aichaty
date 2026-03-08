import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { MetricCard } from "@/components/admin/MetricCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, ShieldOff, Ban, CheckCircle, Zap, ZapOff, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  // Modal state
  const [banModal, setBanModal] = useState(false);
  const [suspendModal, setSuspendModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("1d");
  const [suspendReason, setSuspendReason] = useState("");

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

  const handleBan = async () => {
    await handleAction("ban_user", { reason: banReason });
    setBanModal(false);
    setBanReason("");
  };

  const handleSuspend = async () => {
    await handleAction("suspend_user", { duration: suspendDuration, reason: suspendReason });
    setSuspendModal(false);
    setSuspendReason("");
  };

  if (loading || !detail) {
    return <div className="p-6"><div className="h-64 animate-pulse bg-muted rounded-lg" /></div>;
  }

  const isAdmin = detail.roles?.includes("admin");
  const status = detail.profile?.status || "active";
  const isBanned = status === "banned";
  const isSuspended = status === "suspended";
  const aiEnabled = detail.profile?.ai_access_enabled !== false;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk']">{detail.profile?.display_name || "User"}</h1>
          <p className="text-sm text-muted-foreground">{detail.profile?.user_id}</p>
          {detail.profile?.last_active_at && (
            <p className="text-xs text-muted-foreground">Last active: {new Date(detail.profile.last_active_at).toLocaleString()}</p>
          )}
          {detail.profile?.ban_reason && (
            <p className="text-xs text-destructive mt-1">Ban reason: {detail.profile.ban_reason}</p>
          )}
          {detail.profile?.suspended_until && (
            <p className="text-xs text-yellow-600 mt-1">Suspended until: {new Date(detail.profile.suspended_until).toLocaleString()}</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {detail.roles?.map((r: string) => <StatusBadge key={r} status={r} />)}
          <StatusBadge status={status} />
          {!aiEnabled && <StatusBadge status="warning" />}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Projects" value={detail.project_count} />
        <MetricCard label="Chats" value={detail.chat_count} />
        <MetricCard label="Total Cost" value={`$${detail.total_cost}`} />
        <MetricCard label="Errors" value={detail.error_count || 0} />
        <MetricCard label="Cost Mode" value={detail.preferences?.cost_mode || "balanced"} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Admin Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {/* Role management */}
          {isAdmin ? (
            <Button variant="outline" size="sm" disabled={acting} onClick={() => handleAction("update_user_role", { role: "admin", grant: false })} className="gap-1.5">
              <ShieldOff className="h-4 w-4" /> Remove Admin
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled={acting} onClick={() => handleAction("update_user_role", { role: "admin", grant: true })} className="gap-1.5">
              <Shield className="h-4 w-4" /> Make Admin
            </Button>
          )}

          {/* Ban/Suspend/Reactivate */}
          {isBanned ? (
            <Button variant="outline" size="sm" disabled={acting} onClick={() => handleAction("unban_user")} className="gap-1.5">
              <CheckCircle className="h-4 w-4" /> Unban
            </Button>
          ) : isSuspended ? (
            <Button variant="outline" size="sm" disabled={acting} onClick={() => handleAction("reactivate_user")} className="gap-1.5">
              <CheckCircle className="h-4 w-4" /> Unsuspend
            </Button>
          ) : (
            <>
              <Button variant="destructive" size="sm" disabled={acting} onClick={() => setBanModal(true)} className="gap-1.5">
                <Ban className="h-4 w-4" /> Ban
              </Button>
              <Button variant="outline" size="sm" disabled={acting} onClick={() => setSuspendModal(true)} className="gap-1.5 border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10">
                <Clock className="h-4 w-4" /> Suspend
              </Button>
            </>
          )}

          {/* AI access */}
          {aiEnabled ? (
            <Button variant="outline" size="sm" disabled={acting} onClick={() => handleAction("disable_ai_access")} className="gap-1.5">
              <ZapOff className="h-4 w-4" /> Disable AI
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled={acting} onClick={() => handleAction("enable_ai_access")} className="gap-1.5">
              <Zap className="h-4 w-4" /> Enable AI
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

      {/* Ban Confirmation Modal */}
      <Dialog open={banModal} onOpenChange={setBanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Ban User</DialogTitle>
            <DialogDescription>This will permanently block the user from accessing the app until unbanned.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Reason</Label>
            <Textarea placeholder="Enter ban reason..." value={banReason} onChange={(e) => setBanReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBanModal(false)}>Cancel</Button>
            <Button variant="destructive" disabled={acting || !banReason.trim()} onClick={handleBan}>Confirm Ban</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Confirmation Modal */}
      <Dialog open={suspendModal} onOpenChange={setSuspendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-yellow-500" /> Suspend User</DialogTitle>
            <DialogDescription>Temporarily block user access for a specified duration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Duration</Label>
              <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">1 Day</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea placeholder="Enter suspension reason..." value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSuspendModal(false)}>Cancel</Button>
            <Button className="bg-yellow-600 hover:bg-yellow-700" disabled={acting || !suspendReason.trim()} onClick={handleSuspend}>Confirm Suspend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
