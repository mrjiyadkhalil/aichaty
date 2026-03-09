import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdmin";
import { MetricCard } from "@/components/admin/MetricCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, FolderOpen, MessageSquare, Zap, DollarSign, AlertTriangle, Activity, Ban, Link2, Crown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted))", "hsl(var(--destructive))"];

export default function AdminDashboard() {
  const [period, setPeriod] = useState("7d");
  const [metrics, setMetrics] = useState<any>(null);
  const [planStats, setPlanStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi("get_metrics", { period }),
      adminApi("get_plan_stats"),
    ]).then(([m, p]) => { setMetrics(m); setPlanStats(p.planStats || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  if (loading || !metrics) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-['Space_Grotesk']">Admin Dashboard</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><div className="h-16 animate-pulse bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const successFailData = [
    { name: "Success", value: metrics.successRequests || 0 },
    { name: "Failed", value: metrics.failedRequests || 0 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-['Space_Grotesk']">Admin Dashboard</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
        <MetricCard label="Total Users" value={metrics.totalUsers} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Active (7d)" value={metrics.activeUsers7d} icon={<Activity className="h-5 w-5" />} />
        <MetricCard label="Suspended" value={metrics.suspendedUsers} icon={<Ban className="h-5 w-5" />} />
        <MetricCard label="Chats" value={metrics.totalChats} icon={<MessageSquare className="h-5 w-5" />} />
        <MetricCard label="AI Requests" value={metrics.totalRequests} icon={<Zap className="h-5 w-5" />} />
        <MetricCard label="Est. Cost" value={`$${metrics.totalCost}`} icon={<DollarSign className="h-5 w-5" />} />
        <MetricCard label="Failed" value={metrics.failedRequests} icon={<AlertTriangle className="h-5 w-5" />} />
        <MetricCard label="Errors" value={metrics.totalErrors} icon={<AlertTriangle className="h-5 w-5" />} />
        <MetricCard label="Free Users" value={planStats.free || 0} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Pro Users" value={planStats.pro || 0} icon={<Crown className="h-5 w-5" />} />
        <MetricCard label="Enterprise" value={planStats.enterprise || 0} icon={<Crown className="h-5 w-5" />} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Cost Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metrics.costTrend || []}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="cost" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Success vs Failure</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={successFailData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {successFailData.map((_, i) => <Cell key={i} fill={i === 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {metrics.topUsers?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Top Heavy Users</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Cost</TableHead></TableRow></TableHeader>
                <TableBody>
                  {metrics.topUsers.map((u: any) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="text-xs font-mono">{u.user_id?.slice(0, 8)}...</TableCell>
                      <TableCell>${u.cost}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {metrics.topModels?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Top Models</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Model</TableHead><TableHead>Count</TableHead></TableRow></TableHeader>
                <TableBody>
                  {metrics.topModels.map((m: any) => (
                    <TableRow key={m.model}>
                      <TableCell className="text-xs">{m.model}</TableCell>
                      <TableCell>{m.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {metrics.providerBreakdown?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Provider Breakdown</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Provider</TableHead><TableHead>Requests</TableHead><TableHead>Cost</TableHead></TableRow></TableHeader>
                <TableBody>
                  {metrics.providerBreakdown.map((p: any) => (
                    <TableRow key={p.provider}>
                      <TableCell className="font-medium capitalize">{p.provider}</TableCell>
                      <TableCell>{p.count}</TableCell>
                      <TableCell>${p.cost.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {metrics.recentSignups?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Signups</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.recentSignups.map((u: any) => (
                <div key={u.user_id} className="flex items-center justify-between text-sm">
                  <span>{u.display_name || "Unknown"}</span>
                  <span className="text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
