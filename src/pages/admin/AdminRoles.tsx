import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, UserPlus } from "lucide-react";

export default function AdminRoles() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    adminApi("list_all_roles")
      .then((d) => setRoles(d.roles || []))
      .catch(() => toast.error("Failed to load roles"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newRole.name.trim()) { toast.error("Role name required"); return; }
    setSaving(true);
    try {
      await adminApi("create_custom_role", { name: newRole.name.toLowerCase().replace(/\s+/g, "_"), description: newRole.description });
      toast.success("Role created");
      setAddModal(false);
      setNewRole({ name: "", description: "" });
      load();
    } catch (e: any) { toast.error(e.message || "Failed"); }
    setSaving(false);
  };

  const handleDelete = async (role: string) => {
    try {
      await adminApi("delete_custom_role", { role_name: role });
      toast.success("Role deleted");
      load();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  if (loading) return <div className="p-6"><div className="h-64 animate-pulse bg-muted rounded-lg" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-['Space_Grotesk']">Role Management</h1>
        <Button size="sm" onClick={() => setAddModal(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Create Role
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Type</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.role}>
                  <TableCell className="font-medium">{r.role}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.description || "—"}</TableCell>
                  <TableCell>{r.user_count || 0}</TableCell>
                  <TableCell>
                    <Badge variant={r.is_system ? "secondary" : "outline"}>
                      {r.is_system ? "System" : "Custom"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!r.is_system && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(r.role)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Custom Role</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Role Name</Label>
              <Input placeholder="e.g. moderator, beta-tester" value={newRole.name} onChange={(e) => setNewRole(r => ({ ...r, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="What this role is for" value={newRole.description} onChange={(e) => setNewRole(r => ({ ...r, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
