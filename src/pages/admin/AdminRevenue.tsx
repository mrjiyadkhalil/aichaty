import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/admin/MetricCard";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Download, DollarSign, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

export default function AdminRevenue() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi("get_revenue_data")
      .then(setData)
      .catch(() => toast.error("Failed to load revenue data"))
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    if (!data?.topUsers) return;
    const header = "User ID,Display Name,Total Cost,Requests\n";
    const rows = data.topUsers.map((u: any) => `${u.user_id},${u.display_name || ""},${u.total_cost},${u.request_count}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-top-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-6"><div className="h-64 animate-pulse bg-muted rounded-lg" /></div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold font-['Space_Grotesk']">Revenue & Billing</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Revenue This Month" value={`$${(data?.revenueThisMonth || 0).toFixed(2)}`} icon={<DollarSign className="h-4 w-4" />} />
        <MetricCard label="Revenue All Time" value={`$${(data?.revenueAllTime || 0).toFixed(2)}`} icon={<TrendingUp className="h-4 w-4" />} />
        <MetricCard label="Avg Revenue / User" value={`$${(data?.avgRevenuePerUser || 0).toFixed(4)}`} icon={<Users className="h-4 w-4" />} />
        <MetricCard label="Users Near Cap" value={data?.usersNearCap || 0} icon={<AlertTriangle className="h-4 w-4" />} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Line Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Daily Revenue (Last 30 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data?.dailyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(4)}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Model Pie Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue by Model</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data?.revenueByModel || []} dataKey="revenue" nameKey="model" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name?.split("/").pop()} ${(percent * 100).toFixed(0)}%`}>
                  {(data?.revenueByModel || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `$${Number(v).toFixed(4)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Provider Bar Chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Revenue by Provider</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.revenueByProvider || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="provider" className="fill-muted-foreground" />
              <YAxis className="fill-muted-foreground" tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number) => `$${Number(v).toFixed(4)}`} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Spending Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Top Spending Users</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Avg Cost/Request</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.topUsers || []).map((u: any) => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-medium text-xs">{u.display_name || u.user_id?.slice(0, 8)}</TableCell>
                  <TableCell>${Number(u.total_cost).toFixed(4)}</TableCell>
                  <TableCell>{u.request_count}</TableCell>
                  <TableCell>${(Number(u.total_cost) / (u.request_count || 1)).toFixed(4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
