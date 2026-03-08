import { useState, useMemo } from "react";
import { FolderOpen, MessageSquare, LogOut, ChevronDown, Settings, Plus, Shield, Bookmark, BookOpen, Trash2, Pencil, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdmin";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

interface Project { id: string; name: string; }
interface Chat { id: string; title: string | null; project_id: string | null; updated_at?: string; }

interface AppSidebarProps {
  projects: Project[];
  recentChats: Chat[];
  projectChats: Chat[];
  selectedProjectId: string | null;
}

function groupChatsByDate(chats: Chat[]): { label: string; chats: Chat[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const last7 = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; chats: Chat[] }[] = [
    { label: "Today", chats: [] },
    { label: "Yesterday", chats: [] },
    { label: "Last 7 Days", chats: [] },
    { label: "Older", chats: [] },
  ];

  for (const chat of chats) {
    const d = new Date(chat.updated_at || Date.now());
    if (d >= today) groups[0].chats.push(chat);
    else if (d >= yesterday) groups[1].chats.push(chat);
    else if (d >= last7) groups[2].chats.push(chat);
    else groups[3].chats.push(chat);
  }

  return groups.filter((g) => g.chats.length > 0);
}

export function AppSidebar({ projects, recentChats, projectChats, selectedProjectId }: AppSidebarProps) {
  const { signOut, user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);

  const chatGroups = useMemo(() => groupChatsByDate(recentChats), [recentChats]);

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("chats").delete().eq("id", chatId);
    toast.success("Chat deleted");
    if (location.pathname === `/chat/${chatId}`) navigate("/chat");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate("/chat")}
              tooltip="New Chat"
              className="h-10 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors duration-150"
            >
              <Plus className="h-4 w-4 shrink-0" />
              {!collapsed && <span>New Chat</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Chat History grouped by date */}
        {!collapsed && chatGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium px-2 mb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.chats.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      onClick={() => navigate(`/chat/${chat.id}`)}
                      isActive={location.pathname === `/chat/${chat.id}`}
                      className="h-9 rounded-lg text-[13px] group/chat transition-colors duration-150"
                      onMouseEnter={() => setHoveredChat(chat.id)}
                      onMouseLeave={() => setHoveredChat(null)}
                    >
                      <span className="truncate flex-1 text-left">{chat.title || "New Chat"}</span>
                      {hoveredChat === chat.id && (
                        <button
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Collapsed: show recent chats as icons */}
        {collapsed && recentChats.slice(0, 5).map((chat) => (
          <SidebarMenu key={chat.id}>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate(`/chat/${chat.id}`)}
                isActive={location.pathname === `/chat/${chat.id}`}
                tooltip={chat.title || "Chat"}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ))}

        {/* Projects */}
        {projects.length > 0 && (
          <SidebarGroup>
            <Collapsible defaultOpen={!!selectedProjectId}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-2">
                <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium cursor-pointer">
                  Projects
                </SidebarGroupLabel>
                {!collapsed && <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40" />}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {projects.map((project) => (
                      <SidebarMenuItem key={project.id}>
                        <SidebarMenuButton
                          onClick={() => navigate(`/project/${project.id}`)}
                          isActive={selectedProjectId === project.id}
                          tooltip={project.name}
                          className="h-9 rounded-lg text-[13px] transition-colors duration-150"
                        >
                          <FolderOpen className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{project.name}</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border space-y-0.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => navigate("/prompts")} isActive={location.pathname === "/prompts"} tooltip="Prompts" className="h-9 rounded-lg text-[13px] transition-colors duration-150">
              <BookOpen className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Prompts</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => navigate("/bookmarks")} isActive={location.pathname === "/bookmarks"} tooltip="Bookmarks" className="h-9 rounded-lg text-[13px] transition-colors duration-150">
              <Bookmark className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Bookmarks</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => navigate("/admin")} isActive={location.pathname.startsWith("/admin")} tooltip="Admin" className="h-9 rounded-lg text-[13px] transition-colors duration-150">
                <Shield className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Admin</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>

        <div className="pt-1.5 border-t border-border mt-1.5">
          {!collapsed ? (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-foreground shrink-0">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-xs text-muted-foreground truncate flex-1">{user?.email}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => navigate("/settings")}>
                <Settings className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={signOut}>
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} tooltip="Sign out" className="h-9 rounded-lg">
                  <LogOut className="h-4 w-4 shrink-0" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
