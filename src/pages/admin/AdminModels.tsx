import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/admin/MetricCard";
import { toast } from "sonner";
import { Plus, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminModels() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [perfStats, setPerfStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, m, perf] = await Promise.all([
        adminApi("get_provider_configs"),
        adminApi("get_model_configs"),
        adminApi("get_model_performance"),
      ]);
      setProviders(p.providers || []);
      setModels(m.models || []);
      setPerfStats(perf.stats || []);
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

  const latencyChartData = perfStats.map((s: any) => ({
    model: s.model?.split("/").pop() || s.model,
    avg: s.avg_latency_ms || 0,
    min: s.min_latency_ms || 0,
    max: s.max_latency_ms || 0,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-['Space_Grotesk']">Models & Providers</h1>
        <Button size="sm" onClick={() => navigate("/admin/models/add")} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Model
        </Button>
      </div>

      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5"><Activity className="h-3.5 w-3.5" /> Performance Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
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
                    <TableHead>Custom</TableHead>
                    <TableHead>Premium Only</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-xs">
                        {m.model_name}
                        {m.short_label && <span className="text-muted-foreground ml-1">({m.short_label})</span>}
                      </TableCell>
                      <TableCell className="capitalize">{m.provider_name}</TableCell>
                      <TableCell>
                        <Switch checked={m.enabled} onCheckedChange={(v) => toggleModel(m, "enabled", v)} disabled={saving === m.id} />
                      </TableCell>
                      <TableCell><Badge variant="outline">{m.cost_tier}</Badge></TableCell>
                      <TableCell>{m.max_output_tokens}</TableCell>
                      <TableCell>{m.timeout_seconds}s</TableCell>
                      <TableCell>{m.is_custom ? <Badge variant="secondary">Custom</Badge> : "—"}</TableCell>
                      <TableCell>
                        <Switch checked={m.premium_only} onCheckedChange={(v) => toggleModel(m, "premium_only", v)} disabled={saving === m.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Per-model stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {perfStats.map((s: any) => (
              <Card key={s.model}>
                <CardContent className="p-4 space-y-2">
                  <p className="font-medium text-sm">{s.model}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Requests:</span> {s.total_requests}</div>
                    <div><span className="text-muted-foreground">Success Rate:</span> {s.success_rate}%</div>
                    <div><span className="text-muted-foreground">Avg Latency:</span> {s.avg_latency_ms}ms</div>
                    <div><span className="text-muted-foreground">Errors:</span> {s.error_count}</div>
                    <div><span className="text-muted-foreground">Min/Max:</span> {s.min_latency_ms}–{s.max_latency_ms}ms</div>
                    <div><span className="text-muted-foreground">Cost:</span> ${Number(s.total_cost || 0).toFixed(4)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Latency Comparison Bar Chart */}
          {latencyChartData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Latency Comparison (ms)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={latencyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="model" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                    <YAxis className="fill-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="avg" name="Avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="min" name="Min" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="max" name="Max" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
