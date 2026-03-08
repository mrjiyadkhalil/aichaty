import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "@/hooks/useAdmin";
import { useImpersonation } from "@/hooks/useImpersonation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { MetricCard } from "@/components/admin/MetricCard";
import { PlanBadge } from "@/components/PlanBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, ShieldOff, Ban, CheckCircle, Zap, ZapOff, Clock, Eye, DollarSign, Save, Loader2, Crown, Monitor, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PlanName } from "@/hooks/useSubscription";

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const [banModal, setBanModal] = useState(false);
  const [suspendModal, setSuspendModal] = useState(false);
  const [quotaModal, setQuotaModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("1d");
  const [suspendReason, setSuspendReason] = useState("");
  const [softCap, setSoftCap] = useState("");
  const [hardCap, setHardCap] = useState("");
  const [planModal, setPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanName>("free");
  const [userSessions, setUserSessions] = useState<any[]>([]);

  const load = () => {
    setLoading(true);
    Promise.all([
      adminApi("get_user_detail", { target_user_id: id }),
      adminApi("get_user_sessions", { target_user_id: id }),
    ]).then(([d, s]) => {
      setDetail(d);
      setSoftCap(d.profile?.custom_soft_cap?.toString() || "");
      setHardCap(d.profile?.custom_hard_cap?.toString() || "");
      setSelectedPlan((d.profile?.plan as PlanName) || "free");
      setUserSessions(s.sessions || []);
    })
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
    } catch (e: any) { toast.error(e.message || "Action failed"); }
    setActing(false);
  };

  const handleBan = async () => { await handleAction("ban_user", { reason: banReason }); setBanModal(false); setBanReason(""); };
  const handleSuspend = async () => { await handleAction("suspend_user", { duration: suspendDuration, reason: suspendReason }); setSuspendModal(false); setSuspendReason(""); };

  const handleSaveQuota = async () => {
    setActing(true);
    try {
      await adminApi("update_user_quota", {
        target_user_id: id,
        custom_soft_cap: softCap ? parseFloat(softCap) : null,
        custom_hard_cap: hardCap ? parseFloat(hardCap) : null,
      });
      toast.success("Quota updated");
      setQuotaModal(false);
      load();
    } catch (e: any) { toast.error(e.message || "Failed"); }
    setActing(false);
  };

  const handleImpersonate = () => {
    if (!detail?.profile) return;
    startImpersonation(detail.profile.user_id, detail.profile.display_name || "User");
    navigate("/chat");
  };

  if (loading || !detail) return <div className="p-6"><div className="h-64 animate-pulse bg-muted rounded-lg" /></div>;

  const isAdmin = detail.roles?.includes("admin");
  const status = detail.profile?.status || "active";
  const isBanned = status === "banned";
  const isSuspended = status === "suspended";
  const aiEnabled = detail.profile?.ai_access_enabled !== false;

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold font-['Space_Grotesk']">{detail.profile?.display_name || "User"}</h1>
            <PlanBadge plan={(detail.profile?.plan as PlanName) || "free"} />
          </div>
          <p className="text-sm text-muted-foreground">{detail.profile?.user_id}</p>
          {detail.profile?.last_active_at && <p className="text-xs text-muted-foreground">Last active: {new Date(detail.profile.last_active_at).toLocaleString()}</p>}
          {detail.profile?.ban_reason && <p className="text-xs text-destructive mt-1">Ban reason: {detail.profile.ban_reason}</p>}
          {detail.profile?.suspended_until && <p className="text-xs text-muted-foreground mt-1">Suspended until: {new Date(detail.profile.suspended_until).toLocaleString()}</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {detail.roles?.map((r: string) => <StatusBadge key={r} status={r} />)}
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Projects" value={detail.project_count} />
        <MetricCard label="Chats" value={detail.chat_count} />
        <MetricCard label="Total Cost" value={`$${detail.total_cost}`} />
        <MetricCard label="Soft Cap" value={detail.profile?.custom_soft_cap ? `$${detail.profile.custom_soft_cap}` : "$5 (default)"} />
        <MetricCard label="Hard Cap" value={detail.profile?.custom_hard_cap ? `$${detail.profile.custom_hard_cap}` : "$10 (default)"} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Admin Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {/* Impersonate */}
          <Button variant="outline" size="sm" onClick={handleImpersonate} className="gap-1.5">
            <Eye className="h-4 w-4" /> Impersonate
          </Button>

          {/* Plan management */}
          <Button variant="outline" size="sm" onClick={() => setPlanModal(true)} className="gap-1.5">
            <Crown className="h-4 w-4" /> Change Plan
          </Button>

          {/* Quota Override */}
          <Button variant="outline" size="sm" onClick={() => setQuotaModal(true)} className="gap-1.5">
            <DollarSign className="h-4 w-4" /> Set Quota
          </Button>
          
          {/* Revoke Sessions */}
          <Button variant="outline" size="sm" disabled={acting || userSessions.length === 0} onClick={async () => {
            setActing(true);
            try { await adminApi("revoke_user_sessions", { target_user_id: id }); toast.success("All sessions revoked"); load(); }
            catch (e: any) { toast.error(e.message || "Failed"); }
            setActing(false);
          }} className="gap-1.5">
            <Monitor className="h-4 w-4" /> Revoke Sessions ({userSessions.length})
          </Button>
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

          {/* Ban/Suspend */}
          {isBanned ? (
            <Button variant="outline" size="sm" disabled={acting} onClick={() => handleAction("unban_user")} className="gap-1.5"><CheckCircle className="h-4 w-4" /> Unban</Button>
          ) : isSuspended ? (
            <Button variant="outline" size="sm" disabled={acting} onClick={() => handleAction("reactivate_user")} className="gap-1.5"><CheckCircle className="h-4 w-4" /> Unsuspend</Button>
          ) : (
            <>
              <Button variant="destructive" size="sm" disabled={acting} onClick={() => setBanModal(true)} className="gap-1.5"><Ban className="h-4 w-4" /> Ban</Button>
              <Button variant="outline" size="sm" disabled={acting} onClick={() => setSuspendModal(true)} className="gap-1.5"><Clock className="h-4 w-4" /> Suspend</Button>
            </>
          )}

          {/* AI access */}
          {aiEnabled ? (
            <Button variant="outline" size="sm" disabled={acting} onClick={() => handleAction("disable_ai_access")} className="gap-1.5"><ZapOff className="h-4 w-4" /> Disable AI</Button>
          ) : (
            <Button variant="outline" size="sm" disabled={acting} onClick={() => handleAction("enable_ai_access")} className="gap-1.5"><Zap className="h-4 w-4" /> Enable AI</Button>
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

      {/* Ban Modal */}
      <Dialog open={banModal} onOpenChange={setBanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>Permanently block this user from accessing the app.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3"><Label>Reason</Label><Textarea placeholder="Ban reason..." value={banReason} onChange={(e) => setBanReason(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBanModal(false)}>Cancel</Button>
            <Button variant="destructive" disabled={acting || !banReason.trim()} onClick={handleBan}>Confirm Ban</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Modal */}
      <Dialog open={suspendModal} onOpenChange={setSuspendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>Temporarily block access.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Duration</Label>
              <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">1 Day</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Reason</Label><Textarea placeholder="Reason..." value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSuspendModal(false)}>Cancel</Button>
            <Button disabled={acting || !suspendReason.trim()} onClick={handleSuspend}>Confirm Suspend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quota Override Modal */}
      <Dialog open={quotaModal} onOpenChange={setQuotaModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usage Quota Override</DialogTitle>
            <DialogDescription>Set custom spending limits for this user. Leave blank to use defaults ($5 soft / $10 hard).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Soft Cap ($)</Label>
              <Input type="number" step="0.01" placeholder="5.00" value={softCap} onChange={(e) => setSoftCap(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Hard Cap ($)</Label>
              <Input type="number" step="0.01" placeholder="10.00" value={hardCap} onChange={(e) => setHardCap(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setQuotaModal(false)}>Cancel</Button>
            <Button disabled={acting} onClick={handleSaveQuota} className="gap-1.5">
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Modal */}
      <Dialog open={planModal} onOpenChange={setPlanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>Manually set the user's subscription plan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Plan</Label>
            <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as PlanName)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro ($12/mo)</SelectItem>
                <SelectItem value="enterprise">Enterprise ($49/mo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPlanModal(false)}>Cancel</Button>
            <Button disabled={acting} onClick={async () => {
              setActing(true);
              try {
                await adminApi("update_user_plan", { target_user_id: id, plan: selectedPlan });
                toast.success("Plan updated");
                setPlanModal(false);
                load();
              } catch (e: any) { toast.error(e.message || "Failed"); }
              setActing(false);
            }} className="gap-1.5">
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
