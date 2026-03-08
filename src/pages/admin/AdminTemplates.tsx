import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const CATEGORIES = ["General", "Writing", "Study", "Research", "Coding", "Marketing", "Business"];

const emptyTemplate = { title: "", category: "General", description: "", prompt_body: "", active: true, featured: false };

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: any | null }>({ open: false, editing: null });
  const [form, setForm] = useState(emptyTemplate);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi("list_templates")
      .then((d) => setTemplates(d.templates || []))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyTemplate); setModal({ open: true, editing: null }); };
  const openEdit = (t: any) => {
    setForm({ title: t.title, category: t.category, description: t.description || "", prompt_body: t.prompt_body, active: t.active, featured: t.featured });
    setModal({ open: true, editing: t });
  };

  const save = async () => {
    if (!form.title.trim() || !form.prompt_body.trim()) { toast.error("Title and prompt body required"); return; }
    setSaving(true);
    try {
      if (modal.editing) {
        await adminApi("update_template", { id: modal.editing.id, updates: form });
      } else {
        await adminApi("create_template", form);
      }
      toast.success("Saved");
      setModal({ open: false, editing: null });
      load();
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    try { await adminApi("delete_template", { id }); toast.success("Deleted"); load(); }
    catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-['Space_Grotesk']">Templates</h1>
        <Button size="sm" onClick={openCreate} className="gap-1.5"><Plus className="h-4 w-4" /> Create</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : templates.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No templates</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell className="text-sm">{t.category}</TableCell>
                    <TableCell><StatusBadge status={t.active ? "active" : "suspended"} /></TableCell>
                    <TableCell>{t.featured ? "⭐" : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={modal.open} onOpenChange={(o) => setModal({ ...modal, open: o })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{modal.editing ? "Edit Template" : "Create Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Prompt Body</Label>
              <Textarea value={form.prompt_body} onChange={(e) => setForm({ ...form, prompt_body: e.target.value })} rows={4} />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label className="text-sm">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
                <Label className="text-sm">Featured</Label>
              </div>
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
