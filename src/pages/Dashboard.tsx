import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ProjectCard } from "@/components/ProjectCard";
import { EmptyState } from "@/components/EmptyState";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, Plus, Search, Zap, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Project { id: string; name: string; description: string | null; updated_at: string; }
interface RecentChat { id: string; title: string | null; project_id: string; project_name: string; updated_at: string; }

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [showNewProject, setShowNewProject] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: p } = await supabase.from("projects").select("id, name, description, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
      if (p) setProjects(p);
      const { data: c } = await supabase.from("chats").select("id, title, project_id, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(10);
      if (c && p) {
        const projectMap = Object.fromEntries((p || []).map((pr) => [pr.id, pr.name]));
        setRecentChats(c.map((ch) => ({ ...ch, project_name: projectMap[ch.project_id] || "Unknown" })));
      }
    };
    load();
  }, [user]);

  const createProject = async (name: string, description: string) => {
    if (!user) return;
    const { data, error } = await supabase.from("projects").insert({ name, description, user_id: user.id }).select().single();
    if (error) { toast.error(error.message); return; }
    if (data) { setProjects((prev) => [data as Project, ...prev]); navigate(`/project/${data.id}`); }
  };

  const filtered = projects
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Space_Grotesk']">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your AI comparison workspace</p>
        </div>
        <Button onClick={() => setShowNewProject(true)} className="gap-2 shadow-glow hover:shadow-glow-lg transition-shadow">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      {projects.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="pl-9 bg-card/50 border-border/50" />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as "recent" | "name")}>
            <SelectTrigger className="w-36 bg-card/50 border-border/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ProjectCard name={p.name} description={p.description} updatedAt={p.updated_at} onClick={() => navigate(`/project/${p.id}`)} />
            </motion.div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<Zap className="h-8 w-8 text-primary" />}
          title="Welcome to Fiesta AI"
          description="Compare AI models side by side. Create a project to get started."
          action={<Button onClick={() => setShowNewProject(true)} className="gap-2 shadow-glow"><FolderOpen className="h-4 w-4" /> Create Your First Project</Button>}
        />
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">No projects match your search</p>
      )}

      {recentChats.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold font-['Space_Grotesk']">Recent Chats</h2>
          <div className="glass-card divide-y divide-border/30">
            {recentChats.map((chat) => (
              <button key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="w-full flex items-center gap-3 p-3 hover:bg-surface-hover transition-colors text-left first:rounded-t-xl last:rounded-b-xl">
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{chat.title || "New Chat"}</p>
                  <p className="text-xs text-muted-foreground">{chat.project_name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <NewProjectDialog open={showNewProject} onClose={() => setShowNewProject(false)} onSubmit={createProject} />
    </div>
  );
}
