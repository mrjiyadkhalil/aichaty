import { useState, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { ChatTagManager } from "@/components/ChatTagManager";
import { useIsMobile } from "@/hooks/use-mobile";

interface Project { id: string; name: string; }
interface Chat { id: string; title: string | null; project_id: string | null; updated_at?: string; }

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [projectChats, setProjectChats] = useState<Chat[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const projectMatch = location.pathname.match(/\/project\/([^/]+)/);
  const chatMatch = location.pathname.match(/\/chat\/([^/]+)/);
  const currentProjectId = projectMatch?.[1] || null;
  const currentChatId = chatMatch?.[1] || null;

  const loadData = () => {
    if (!user) return;
    supabase.from("projects").select("id, name").order("updated_at", { ascending: false }).then(({ data }) => {
      if (data) setProjects(data);
    });
    supabase.from("chats").select("id, title, project_id, updated_at").eq("user_id", user.id)
      .order("updated_at", { ascending: false }).limit(30).then(({ data }) => {
        if (data) setRecentChats(data);
      });
  };

  useEffect(() => {
    loadData();
  }, [user, location.pathname]);

  useEffect(() => {
    if (currentProjectId) {
      setSelectedProjectId(currentProjectId);
    } else if (currentChatId) {
      supabase.from("chats").select("project_id").eq("id", currentChatId).single().then(({ data }) => {
        setSelectedProjectId(data?.project_id || null);
      });
    } else {
      setSelectedProjectId(null);
    }
  }, [currentProjectId, currentChatId]);

  useEffect(() => {
    if (!selectedProjectId) { setProjectChats([]); return; }
    supabase.from("chats").select("id, title, project_id, updated_at").eq("project_id", selectedProjectId)
      .order("updated_at", { ascending: false }).then(({ data }) => {
        if (data) setProjectChats(data);
      });
  }, [selectedProjectId, location.pathname]);

  const getTitle = () => {
    if (location.pathname === "/chat") return "New Chat";
    if (location.pathname === "/settings") return "Settings";
    if (location.pathname === "/bookmarks") return "Bookmarks";
    if (location.pathname === "/prompts") return "Prompt Library";
    if (currentProjectId) {
      const p = projects.find((pr) => pr.id === currentProjectId);
      return p?.name || "Project";
    }
    if (currentChatId) {
      const c = [...recentChats, ...projectChats].find((ch) => ch.id === currentChatId);
      return c?.title || "Chat";
    }
    return "Fiesta AI";
  };

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar projects={projects} recentChats={recentChats} projectChats={projectChats} selectedProjectId={selectedProjectId} onProjectsChanged={loadData} />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center">
            <TopBar title={getTitle()} />
            {currentChatId && (
              <div className="shrink-0 pr-2 md:pr-3 h-12 flex items-center border-b border-border bg-background">
                <ChatTagManager chatId={currentChatId} />
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
