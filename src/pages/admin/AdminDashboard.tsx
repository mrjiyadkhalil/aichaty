import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdmin";
import { MetricCard } from "@/components/admin/MetricCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, FolderOpen, MessageSquare, Zap, DollarSign, AlertTriangle, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  const [period, setPeriod] = useState("7d");
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi("get_metrics", { period })
      .then(setMetrics)
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Users" value={metrics.totalUsers} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Active (7d)" value={metrics.activeUsers7d} icon={<Activity className="h-5 w-5" />} />
        <MetricCard label="Projects" value={metrics.totalProjects} icon={<FolderOpen className="h-5 w-5" />} />
        <MetricCard label="Chats" value={metrics.totalChats} icon={<MessageSquare className="h-5 w-5" />} />
        <MetricCard label="AI Requests" value={metrics.totalRequests} icon={<Zap className="h-5 w-5" />} />
        <MetricCard label="Est. Cost" value={`$${metrics.totalCost}`} icon={<DollarSign className="h-5 w-5" />} />
        <MetricCard label="Failed" value={metrics.failedRequests} icon={<AlertTriangle className="h-5 w-5" />} />
        <MetricCard label="Errors" value={metrics.totalErrors} icon={<AlertTriangle className="h-5 w-5" />} />
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
