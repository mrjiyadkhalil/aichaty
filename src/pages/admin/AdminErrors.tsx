import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

export default function AdminErrors() {
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const load = () => {
    setLoading(true);
    adminApi("list_error_logs", { page, limit: 20 })
      .then((d) => setErrors(d.errors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const resolve = async (id: string) => {
    try {
      await adminApi("resolve_error", { error_id: id });
      toast.success("Marked resolved");
      load();
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold font-['Space_Grotesk']">Error Logs</h1>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : errors.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No errors logged</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-medium">{e.error_type}</TableCell>
                    <TableCell><StatusBadge status={e.severity} /></TableCell>
                    <TableCell className="text-xs">{e.provider || "—"}</TableCell>
                    <TableCell className="text-xs max-w-xs truncate">{e.message}</TableCell>
                    <TableCell>
                      {e.resolved_at ? <StatusBadge status="resolved" /> : <StatusBadge status="error" />}
                    </TableCell>
                    <TableCell>
                      {!e.resolved_at && (
                        <Button variant="ghost" size="sm" onClick={() => resolve(e.id)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={errors.length < 20} onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
