import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";

const emptyAnnouncement = { title: "", message: "", type: "info", placement: "dashboard", active: true, start_at: "", end_at: "" };

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: any | null }>({ open: false, editing: null });
  const [form, setForm] = useState(emptyAnnouncement);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi("list_announcements")
      .then((d) => setAnnouncements(d.announcements || []))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyAnnouncement); setModal({ open: true, editing: null }); };
  const openEdit = (a: any) => {
    setForm({
      title: a.title, message: a.message, type: a.type, placement: a.placement,
      active: a.active, start_at: a.start_at || "", end_at: a.end_at || "",
    });
    setModal({ open: true, editing: a });
  };

  const save = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error("Title and message required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, start_at: form.start_at || null, end_at: form.end_at || null };
      if (modal.editing) {
        await adminApi("update_announcement", { id: modal.editing.id, updates: payload });
      } else {
        await adminApi("create_announcement", payload);
      }
      toast.success("Saved");
      setModal({ open: false, editing: null });
      load();
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    try { await adminApi("delete_announcement", { id }); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-['Space_Grotesk']">Announcements</h1>
        <Button size="sm" onClick={openCreate} className="gap-1.5"><Plus className="h-4 w-4" /> Create</Button>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse bg-muted rounded-lg" />
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <Megaphone className="h-8 w-8 text-muted-foreground/40" />
            No announcements yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{a.title}</p>
                    <StatusBadge status={a.type} />
                    <StatusBadge status={a.active ? "active" : "suspended"} />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">Placement: {a.placement} • Created: {new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modal.open} onOpenChange={(o) => setModal({ ...modal, open: o })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{modal.editing ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Placement</Label>
                <Select value={form.placement} onValueChange={(v) => setForm({ ...form, placement: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="chat">Chat Page</SelectItem>
                    <SelectItem value="global">Global Banner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label className="text-sm">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
