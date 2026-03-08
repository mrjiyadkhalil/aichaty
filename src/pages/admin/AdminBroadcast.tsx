import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

export default function AdminBroadcast() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", type: "info", target: "all" });

  const load = () => {
    adminApi("list_broadcasts")
      .then((d) => setMessages(d.broadcasts || []))
      .catch(() => toast.error("Failed to load broadcasts"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) { toast.error("Title and body required"); return; }
    setSending(true);
    try {
      await adminApi("send_broadcast", form);
      toast.success("Broadcast sent");
      setForm({ title: "", body: "", type: "info", target: "all" });
      load();
    } catch (e: any) { toast.error(e.message || "Failed to send"); }
    setSending(false);
  };

  const typeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      info: "default", warning: "secondary", critical: "destructive",
    };
    return <Badge variant={variants[type] || "default"}>{type}</Badge>;
  };

  if (loading) return <div className="p-6"><div className="h-64 animate-pulse bg-muted rounded-lg" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold font-['Space_Grotesk']">Broadcast Messages</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Send New Broadcast</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input placeholder="Notification title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Target</Label>
                <Select value={form.target} onValueChange={(v) => setForm(f => ({ ...f, target: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="admins">Admins Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Message Body</Label>
            <Textarea rows={3} placeholder="Write your broadcast message..." value={form.body} onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))} />
          </div>
          <Button onClick={handleSend} disabled={sending} className="gap-1.5">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Broadcast
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Previous Broadcasts</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-sm">{m.title}</TableCell>
                  <TableCell>{typeBadge(m.type)}</TableCell>
                  <TableCell className="capitalize">{m.target}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(m.sent_at || m.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {messages.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No broadcasts sent yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
