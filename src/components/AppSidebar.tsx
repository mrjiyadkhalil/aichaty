import { FolderOpen, MessageSquare, LogOut, Zap, ChevronDown, Settings, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Project { id: string; name: string; }
interface Chat { id: string; title: string | null; project_id: string; }

interface AppSidebarProps {
  projects: Project[];
  chats: Chat[];
  selectedProjectId: string | null;
}

export function AppSidebar({ projects, chats, selectedProjectId }: AppSidebarProps) {
  const { signOut, user } = useAuth();
  const { state } = useSidebar();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/dashboard")}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-glow-sm">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-lg tracking-tight font-['Space_Grotesk']">Fiesta AI</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/dashboard")} isActive={location.pathname === "/dashboard"} tooltip="Dashboard">
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Dashboard</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/settings")} isActive={location.pathname === "/settings"} tooltip="Settings">
                  <Settings className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Settings</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70">Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton onClick={() => navigate(`/project/${project.id}`)} isActive={selectedProjectId === project.id} tooltip={project.name}>
                    <FolderOpen className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{project.name}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {projects.length === 0 && !collapsed && (
                <p className="px-4 py-2 text-xs text-muted-foreground">No projects yet</p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {selectedProjectId && chats.length > 0 && !collapsed && (
          <SidebarGroup>
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-2">
                <SidebarGroupLabel className="cursor-pointer text-muted-foreground/70">Chats</SidebarGroupLabel>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {chats.map((chat) => (
                      <SidebarMenuItem key={chat.id}>
                        <SidebarMenuButton onClick={() => navigate(`/chat/${chat.id}`)} isActive={location.pathname === `/chat/${chat.id}`}>
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          <span className="truncate">{chat.title || "New Chat"}</span>
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

      <SidebarFooter className="p-3 border-t border-border/30">
        {!collapsed && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.email}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        )}
        {collapsed && (
          <Button variant="ghost" size="icon" className="h-7 w-7 mx-auto text-muted-foreground hover:text-foreground" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
