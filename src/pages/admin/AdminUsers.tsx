import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/hooks/useAdmin";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, Shield, ShieldOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PlanBadge } from "@/components/PlanBadge";
import { toast } from "sonner";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [roleModal, setRoleModal] = useState<{ user: any; action: "grant" | "revoke" } | null>(null);
  const [acting, setActing] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    adminApi("list_users", {
      search,
      sort,
      role: roleFilter === "all" ? undefined : roleFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
    })
      .then((d) => setUsers(d.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter, sort]);

  const handleRoleChange = async () => {
    if (!roleModal) return;
    setActing(true);
    try {
      await adminApi("update_user_role", {
        target_user_id: roleModal.user.user_id,
        role: "admin",
        grant: roleModal.action === "grant",
      });
      toast.success(roleModal.action === "grant" ? "Admin role granted" : "Admin role removed");
      setRoleModal(null);
      loadUsers();
    } catch (e: any) {
      toast.error(e.message || "Failed to update role");
    }
    setActing(false);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold font-['Space_Grotesk']">Users</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-28"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-28"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No users found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Chats</TableHead>
                  <TableHead>Est. Cost</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isAdmin = u.roles?.includes("admin");
                  return (
                    <TableRow key={u.user_id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium" onClick={() => navigate(`/admin/users/${u.user_id}`)}>{u.display_name || "—"}</TableCell>
                      <TableCell onClick={() => navigate(`/admin/users/${u.user_id}`)}>
                        <div className="flex gap-1">
                          {u.roles?.map((r: string) => <StatusBadge key={r} status={r} />)}
                        </div>
                      </TableCell>
                      <TableCell onClick={() => navigate(`/admin/users/${u.user_id}`)}><StatusBadge status={u.status || "active"} /></TableCell>
                      <TableCell onClick={() => navigate(`/admin/users/${u.user_id}`)}>{u.project_count}</TableCell>
                      <TableCell onClick={() => navigate(`/admin/users/${u.user_id}`)}>{u.chat_count}</TableCell>
                      <TableCell onClick={() => navigate(`/admin/users/${u.user_id}`)}>${u.estimated_cost}</TableCell>
                      <TableCell className="text-muted-foreground text-xs" onClick={() => navigate(`/admin/users/${u.user_id}`)}>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {isAdmin ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); setRoleModal({ user: u, action: "revoke" }); }}
                          >
                            <ShieldOff className="h-3.5 w-3.5" /> Remove Admin
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground hover:text-primary"
                            onClick={(e) => { e.stopPropagation(); setRoleModal({ user: u, action: "grant" }); }}
                          >
                            <Shield className="h-3.5 w-3.5" /> Make Admin
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Role Change Confirmation Modal */}
      <Dialog open={!!roleModal} onOpenChange={() => setRoleModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {roleModal?.action === "grant" ? "Make Admin" : "Remove Admin"}
            </DialogTitle>
            <DialogDescription>
              {roleModal?.action === "grant"
                ? `Are you sure you want to grant admin privileges to "${roleModal?.user?.display_name || "this user"}"? They will have full access to the admin panel.`
                : `Are you sure you want to remove admin privileges from "${roleModal?.user?.display_name || "this user"}"? They will lose access to the admin panel.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRoleModal(null)}>Cancel</Button>
            <Button
              variant={roleModal?.action === "revoke" ? "destructive" : "default"}
              disabled={acting}
              onClick={handleRoleChange}
            >
              {roleModal?.action === "grant" ? "Grant Admin" : "Remove Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
