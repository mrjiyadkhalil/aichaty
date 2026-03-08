import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/hooks/useAdmin";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi("list_users", { search, sort: "newest" })
      .then((d) => setUsers(d.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold font-['Space_Grotesk']">Users</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No users found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Chats</TableHead>
                  <TableHead>Est. Cost</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/users/${u.user_id}`)}>
                    <TableCell className="font-medium">{u.display_name || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {u.roles?.map((r: string) => <StatusBadge key={r} status={r} />)}
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={u.status || "active"} /></TableCell>
                    <TableCell>{u.project_count}</TableCell>
                    <TableCell>{u.chat_count}</TableCell>
                    <TableCell>${u.estimated_cost}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</TableCell>
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
