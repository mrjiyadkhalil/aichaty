import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { toast } from "sonner";
import { LinkIcon } from "lucide-react";

export default function AdminShareLinks() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);

  const load = () => {
    setLoading(true);
    adminApi("list_share_links", { status: statusFilter === "all" ? undefined : statusFilter, page, limit: 20 })
      .then((d) => setLinks(d.links || []))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, page]);

  const revoke = async (id: string) => {
    try { await adminApi("revoke_share_link", { id }); toast.success("Revoked"); load(); }
    catch { toast.error("Failed"); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-['Space_Grotesk']">Share Links</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : links.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <LinkIcon className="h-8 w-8 text-muted-foreground/40" />
              No share links found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Chat</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Accessed</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.token?.slice(0, 12)}...</TableCell>
                    <TableCell className="text-xs">{l.user_id?.slice(0, 8)}...</TableCell>
                    <TableCell className="text-xs">{l.chat_id?.slice(0, 8)}...</TableCell>
                    <TableCell><StatusBadge status={l.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.last_accessed_at ? new Date(l.last_accessed_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      {l.status === "active" && (
                        <Button variant="destructive" size="sm" onClick={() => revoke(l.id)}>Revoke</Button>
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
        <Button variant="outline" size="sm" disabled={links.length < 20} onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
