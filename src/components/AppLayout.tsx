import { useState, useEffect, ReactNode } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";

interface Project { id: string; name: string; }
interface Chat { id: string; title: string | null; project_id: string; }

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [layout, setLayout] = useState<"grid" | "stacked">("grid");

  // Extract IDs from URL
  const projectMatch = location.pathname.match(/\/project\/([^/]+)/);
  const chatMatch = location.pathname.match(/\/chat\/([^/]+)/);
  const currentProjectId = projectMatch?.[1] || null;
  const currentChatId = chatMatch?.[1] || null;

  // Load projects
  useEffect(() => {
    if (!user) return;
    supabase.from("projects").select("id, name").order("updated_at", { ascending: false }).then(({ data }) => {
      if (data) setProjects(data);
    });
  }, [user, location.pathname]);

  // Determine selected project (from URL or chat)
  useEffect(() => {
    if (currentProjectId) {
      setSelectedProjectId(currentProjectId);
    } else if (currentChatId) {
      supabase.from("chats").select("project_id").eq("id", currentChatId).single().then(({ data }) => {
        if (data) setSelectedProjectId(data.project_id);
      });
    } else {
      setSelectedProjectId(null);
    }
  }, [currentProjectId, currentChatId]);

  // Load chats for selected project
  useEffect(() => {
    if (!selectedProjectId) { setChats([]); return; }
    supabase.from("chats").select("id, title, project_id").eq("project_id", selectedProjectId)
      .order("updated_at", { ascending: false }).then(({ data }) => {
        if (data) setChats(data);
      });
  }, [selectedProjectId, location.pathname]);

  const toggleTheme = () => document.documentElement.classList.toggle("dark");

  const getTitle = () => {
    if (location.pathname === "/dashboard") return "Dashboard";
    if (location.pathname === "/settings") return "Settings";
    if (currentProjectId) {
      const p = projects.find((pr) => pr.id === currentProjectId);
      return p?.name || "Project";
    }
    if (currentChatId) {
      const c = chats.find((ch) => ch.id === currentChatId);
      return c?.title || "Chat";
    }
    return "Fiesta AI";
  };

  const isChatPage = !!currentChatId;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar projects={projects} chats={chats} selectedProjectId={selectedProjectId} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            title={getTitle()}
            layout={isChatPage ? layout : undefined}
            onToggleLayout={isChatPage ? () => setLayout((l) => l === "grid" ? "stacked" : "grid") : undefined}
            onToggleTheme={toggleTheme}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
