import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function AdminModels() {
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([adminApi("get_provider_configs"), adminApi("get_model_configs")]);
      setProviders(p.providers || []);
      setModels(m.models || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleProvider = async (p: any) => {
    try {
      await adminApi("update_provider_config", { id: p.id, updates: { enabled: !p.enabled } });
      toast.success(`${p.provider_name} ${p.enabled ? "disabled" : "enabled"}`);
      load();
    } catch { toast.error("Failed to update provider"); }
  };

  const toggleModel = async (m: any, field: string, value: unknown) => {
    setSaving(m.id);
    try {
      await adminApi("update_model_config", { id: m.id, updates: { [field]: value } });
      toast.success("Model updated");
      load();
    } catch { toast.error("Failed to update model"); }
    setSaving(null);
  };

  if (loading) return <div className="p-6"><div className="h-64 animate-pulse bg-muted rounded-lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold font-['Space_Grotesk']">Models & Providers</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">{p.provider_name}</p>
                <p className="text-xs text-muted-foreground">Timeout: {p.timeout_seconds}s • Retry: {p.retry_enabled ? "Yes" : "No"}</p>
              </div>
              <Switch checked={p.enabled} onCheckedChange={() => toggleProvider(p)} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Model Configurations</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Cost Tier</TableHead>
                <TableHead>Max Tokens</TableHead>
                <TableHead>Timeout</TableHead>
                <TableHead>Premium Only</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-xs">{m.model_name}</TableCell>
                  <TableCell className="capitalize">{m.provider_name}</TableCell>
                  <TableCell>
                    <Switch checked={m.enabled} onCheckedChange={(v) => toggleModel(m, "enabled", v)} disabled={saving === m.id} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{m.cost_tier}</Badge>
                  </TableCell>
                  <TableCell>{m.max_output_tokens}</TableCell>
                  <TableCell>{m.timeout_seconds}s</TableCell>
                  <TableCell>
                    <Switch checked={m.premium_only} onCheckedChange={(v) => toggleModel(m, "premium_only", v)} disabled={saving === m.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
