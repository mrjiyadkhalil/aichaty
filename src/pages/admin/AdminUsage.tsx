import { useState, useEffect, useMemo } from "react";
import { adminApi } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function AdminUsage() {
  const [days, setDays] = useState(30);
  const [usage, setUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi("list_usage", { days })
      .then((d) => setUsage(d.usage || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const dailyData = useMemo(() => {
    const map: Record<string, { date: string; requests: number; cost: number }> = {};
    usage.forEach((u) => {
      const day = u.created_at?.slice(0, 10);
      if (!day) return;
      if (!map[day]) map[day] = { date: day, requests: 0, cost: 0 };
      map[day].requests++;
      map[day].cost += Number(u.estimated_cost) || 0;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [usage]);

  const providerBreakdown = useMemo(() => {
    const map: Record<string, { provider: string; count: number; cost: number }> = {};
    usage.forEach((u) => {
      const p = u.provider || "unknown";
      if (!map[p]) map[p] = { provider: p, count: 0, cost: 0 };
      map[p].count++;
      map[p].cost += Number(u.estimated_cost) || 0;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [usage]);

  const modelBreakdown = useMemo(() => {
    const map: Record<string, { model: string; count: number; cost: number }> = {};
    usage.forEach((u) => {
      const m = u.model || "unknown";
      if (!map[m]) map[m] = { model: m, count: 0, cost: 0 };
      map[m].count++;
      map[m].cost += Number(u.estimated_cost) || 0;
    });
    return Object.values(map).sort((a, b) => b.cost - a.cost);
  }, [usage]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-['Space_Grotesk']">Usage & Cost</h1>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse bg-muted rounded-lg" />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Daily Requests</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dailyData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Daily Cost ($)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={dailyData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="cost" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">By Provider</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Requests</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providerBreakdown.map((p) => (
                      <TableRow key={p.provider}>
                        <TableCell className="font-medium">{p.provider}</TableCell>
                        <TableCell>{p.count}</TableCell>
                        <TableCell>${p.cost.toFixed(4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">By Model</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Requests</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelBreakdown.map((m) => (
                      <TableRow key={m.model}>
                        <TableCell className="font-medium text-xs">{m.model}</TableCell>
                        <TableCell>{m.count}</TableCell>
                        <TableCell>${m.cost.toFixed(4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
