import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdmin";
import { MetricCard } from "@/components/admin/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Zap, Clock, AlertTriangle } from "lucide-react";

export default function AdminSystemHealth() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi("get_system_health")
      .then(setHealth)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !health) {
    return <div className="p-6"><div className="h-64 animate-pulse bg-muted rounded-lg" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold font-['Space_Grotesk']">System Health</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Requests (24h)" value={health.total24h} icon={<Zap className="h-5 w-5" />} />
        <MetricCard label="Success Rate" value={`${health.successRate24h}%`} icon={<Activity className="h-5 w-5" />} />
        <MetricCard label="Avg Latency" value={`${health.avgLatency}ms`} icon={<Clock className="h-5 w-5" />} />
        <MetricCard label="Errors (24h)" value={health.errorCount24h} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Provider Health (24h)</CardTitle></CardHeader>
        <CardContent className="p-0">
          {health.providers?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No data</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Avg Latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {health.providers?.map((p: any) => (
                  <TableRow key={p.provider}>
                    <TableCell className="font-medium capitalize">{p.provider}</TableCell>
                    <TableCell>{p.total}</TableCell>
                    <TableCell className={p.successRate < 90 ? "text-destructive" : ""}>{p.successRate}%</TableCell>
                    <TableCell>{p.avgLatency}ms</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Request Types (24h)</CardTitle></CardHeader>
        <CardContent className="p-0">
          {health.requestTypes?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No data</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Success Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {health.requestTypes?.map((r: any) => (
                  <TableRow key={r.type}>
                    <TableCell className="font-medium">{r.type}</TableCell>
                    <TableCell>{r.total}</TableCell>
                    <TableCell className={r.successRate < 90 ? "text-destructive" : ""}>{r.successRate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
