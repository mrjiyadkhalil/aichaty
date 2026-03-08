import { FolderOpen, MessageSquare, LogOut, Zap, ChevronDown, Settings, Plus, Shield } from "lucide-react";
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
interface Chat { id: string; title: string | null; project_id: string | null; }

interface AppSidebarProps {
  projects: Project[];
  recentChats: Chat[];
  projectChats: Chat[];
  selectedProjectId: string | null;
}

export function AppSidebar({ projects, recentChats, projectChats, selectedProjectId }: AppSidebarProps) {
  const { signOut, user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();

  const handleNewChat = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("chats").insert({ user_id: user.id, title: "New Chat" }).select().single();
    if (error) { toast.error("Failed to create chat"); return; }
    if (data) navigate(`/chat/${data.id}`);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/chat")}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-glow-sm">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-lg tracking-tight font-['Space_Grotesk']">Fiesta AI</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* New Chat Button */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNewChat} tooltip="New Chat" className="bg-primary/10 hover:bg-primary/20 text-primary font-medium">
                  <Plus className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>New Chat</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/settings")} isActive={location.pathname === "/settings"} tooltip="Settings">
                  <Settings className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Settings</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/settings")} isActive={location.pathname === "/settings"} tooltip="Settings">
                  <Settings className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Settings</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/admin")} isActive={location.pathname.startsWith("/admin")} tooltip="Admin Panel">
                    <Shield className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Admin Panel</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projects */}
        <SidebarGroup>
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-2">
              <SidebarGroupLabel className="cursor-pointer text-muted-foreground/70">Projects</SidebarGroupLabel>
              {!collapsed && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Recent Chats */}
        {recentChats.length > 0 && !collapsed && (
          <SidebarGroup>
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-2">
                <SidebarGroupLabel className="cursor-pointer text-muted-foreground/70">Recent Chats</SidebarGroupLabel>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {recentChats.map((chat) => (
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

        {/* Project Chats (when a project is selected) */}
        {selectedProjectId && projectChats.length > 0 && !collapsed && (
          <SidebarGroup>
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-2">
                <SidebarGroupLabel className="cursor-pointer text-muted-foreground/70">Project Chats</SidebarGroupLabel>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {projectChats.map((chat) => (
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