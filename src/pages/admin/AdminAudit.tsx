import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    adminApi("list_audit_logs", { page, limit: 20 })
      .then((d) => setLogs(d.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold font-['Space_Grotesk']">Audit Log</h1>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No audit events</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-mono">{l.admin_user_id?.slice(0, 8)}...</TableCell>
                    <TableCell className="text-xs font-medium">{l.action_type}</TableCell>
                    <TableCell className="text-xs">{l.target_type}: {l.target_id?.slice(0, 8)}...</TableCell>
                    <TableCell className="text-xs max-w-xs truncate">{l.details_json ? JSON.stringify(l.details_json) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={logs.length < 20} onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
