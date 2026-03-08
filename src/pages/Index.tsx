import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar, AVAILABLE_MODELS } from "@/components/TopBar";
import { PromptInput } from "@/components/PromptInput";
import { ModelResponseCard } from "@/components/ModelResponseCard";
import { NewProjectDialog } from "@/components/NewProjectDialog";
import { toast } from "sonner";
import { Zap, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Project {
  id: string;
  name: string;
  description: string;
  preferred_models: string[];
}

interface Chat {
  id: string;
  title: string;
  project_id: string;
}

interface MessageWithResponses {
  id: string;
  content: string;
  created_at: string;
  responses: {
    id: string;
    model: string;
    content: string | null;
    status: string;
    error_message: string | null;
    included_in_synthesis: boolean;
  }[];
}

export default function Index() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithResponses[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>(["google/gemini-3-flash-preview"]);
  const [sending, setSending] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Load projects
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("projects").select("*").order("updated_at", { ascending: false });
      if (data) setProjects(data as Project[]);
    };
    load();
  }, [user]);

  // Load chats for selected project
  useEffect(() => {
    if (!selectedProjectId) { setChats([]); return; }
    const load = async () => {
      const { data } = await supabase.from("chats").select("*").eq("project_id", selectedProjectId).order("updated_at", { ascending: false });
      if (data) setChats(data as Chat[]);
    };
    load();
  }, [selectedProjectId]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChatId) { setMessages([]); return; }
    const load = async () => {
      const { data: msgs } = await supabase.from("messages").select("*").eq("chat_id", selectedChatId).order("created_at", { ascending: true });
      if (!msgs) return;
      const withResponses: MessageWithResponses[] = [];
      for (const msg of msgs) {
        const { data: responses } = await supabase.from("model_responses").select("*").eq("message_id", msg.id);
        withResponses.push({
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          responses: (responses || []).map((r: any) => ({
            id: r.id,
            model: r.model,
            content: r.content,
            status: r.status,
            error_message: r.error_message,
            included_in_synthesis: r.included_in_synthesis,
          })),
        });
      }
      setMessages(withResponses);
    };
    load();
  }, [selectedChatId]);

  // Update models when project changes
  useEffect(() => {
    if (selectedProject?.preferred_models?.length) {
      setSelectedModels(selectedProject.preferred_models);
    }
  }, [selectedProject]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId]
    );
  };

  const createProject = async (name: string, description: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("projects")
      .insert({ name, description, user_id: user.id })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    if (data) {
      setProjects((prev) => [data as Project, ...prev]);
      setSelectedProjectId(data.id);
    }
  };

  const createChat = async () => {
    if (!user || !selectedProjectId) return;
    const { data, error } = await supabase
      .from("chats")
      .insert({ project_id: selectedProjectId, user_id: user.id, title: "New Chat" })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    if (data) {
      setChats((prev) => [data as Chat, ...prev]);
      setSelectedChatId(data.id);
      setMessages([]);
    }
  };

  const handleSend = async (prompt: string) => {
    if (!user || !selectedChatId || selectedModels.length === 0) {
      toast.error("Select at least one model and a chat");
      return;
    }
    setSending(true);

    // Save message
    const { data: msg, error: msgErr } = await supabase
      .from("messages")
      .insert({ chat_id: selectedChatId, user_id: user.id, content: prompt })
      .select()
      .single();
    if (msgErr || !msg) { toast.error("Failed to save message"); setSending(false); return; }

    // Create placeholder responses
    const placeholders = selectedModels.map((model) => ({
      message_id: msg.id,
      user_id: user.id,
      model,
      status: "loading" as const,
      content: null,
      error_message: null,
      included_in_synthesis: true,
    }));

    const { data: responseRows } = await supabase.from("model_responses").insert(placeholders).select();

    const newMsg: MessageWithResponses = {
      id: msg.id,
      content: msg.content,
      created_at: msg.created_at,
      responses: (responseRows || []).map((r: any) => ({
        id: r.id,
        model: r.model,
        content: r.content,
        status: r.status,
        error_message: r.error_message,
        included_in_synthesis: r.included_in_synthesis,
      })),
    };
    setMessages((prev) => [...prev, newMsg]);

    // Call edge function for each model in parallel
    const calls = selectedModels.map(async (model) => {
      try {
        const resp = await supabase.functions.invoke("multi-model-chat", {
          body: { prompt, model, projectId: selectedProjectId },
        });
        const responseId = newMsg.responses.find((r) => r.model === model)?.id;
        if (!responseId) return;
        if (resp.error) {
          await supabase.from("model_responses").update({ status: "error", error_message: resp.error.message }).eq("id", responseId);
          setMessages((prev) => prev.map((m) => m.id === msg.id ? {
            ...m,
            responses: m.responses.map((r) => r.model === model ? { ...r, status: "error", error_message: resp.error.message } : r),
          } : m));
        } else {
          const aiContent = resp.data?.content || "No response";
          await supabase.from("model_responses").update({ status: "success", content: aiContent }).eq("id", responseId);
          setMessages((prev) => prev.map((m) => m.id === msg.id ? {
            ...m,
            responses: m.responses.map((r) => r.model === model ? { ...r, status: "success", content: aiContent } : r),
          } : m));
        }
      } catch (e: any) {
        const responseId = newMsg.responses.find((r) => r.model === model)?.id;
        if (responseId) {
          await supabase.from("model_responses").update({ status: "error", error_message: e.message }).eq("id", responseId);
          setMessages((prev) => prev.map((m) => m.id === msg.id ? {
            ...m,
            responses: m.responses.map((r) => r.model === model ? { ...r, status: "error", error_message: e.message } : r),
          } : m));
        }
      }
    });

    await Promise.all(calls);
    setSending(false);

    // Update chat title with first message
    if (messages.length === 0) {
      const title = prompt.slice(0, 50) + (prompt.length > 50 ? "..." : "");
      await supabase.from("chats").update({ title }).eq("id", selectedChatId);
      setChats((prev) => prev.map((c) => c.id === selectedChatId ? { ...c, title } : c));
    }
  };

  const handleEnhance = async (prompt: string) => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    toast.info("Prompt enhancement coming in Phase 4!");
    setEnhancing(false);
  };

  const toggleInclude = async (responseId: string, messageId: string) => {
    setMessages((prev) => prev.map((m) => m.id === messageId ? {
      ...m,
      responses: m.responses.map((r) => r.id === responseId ? { ...r, included_in_synthesis: !r.included_in_synthesis } : r),
    } : m));
    const msg = messages.find((m) => m.id === messageId);
    const resp = msg?.responses.find((r) => r.id === responseId);
    if (resp) {
      await supabase.from("model_responses").update({ included_in_synthesis: !resp.included_in_synthesis }).eq("id", responseId);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar
          projects={projects}
          chats={chats}
          selectedProjectId={selectedProjectId}
          selectedChatId={selectedChatId}
          onSelectProject={(id) => { setSelectedProjectId(id); setSelectedChatId(null); }}
          onSelectChat={setSelectedChatId}
          onNewProject={() => setShowNewProject(true)}
          onNewChat={createChat}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            projectName={selectedProject?.name || null}
            selectedModels={selectedModels}
            onToggleModel={toggleModel}
            onToggleTheme={toggleTheme}
          />

          <main className="flex-1 overflow-y-auto">
            {!selectedProjectId ? (
              <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold">Welcome to Fiesta AI</h1>
                  <p className="text-muted-foreground max-w-md">
                    Compare AI models side by side. Create a project to get started.
                  </p>
                </div>
                <Button onClick={() => setShowNewProject(true)} className="gap-2">
                  <FolderOpen className="h-4 w-4" /> Create Your First Project
                </Button>
              </div>
            ) : !selectedChatId ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                <h2 className="text-xl font-semibold">{selectedProject?.name}</h2>
                <p className="text-muted-foreground">Start a new chat to compare AI models</p>
                <Button onClick={createChat} variant="outline" className="gap-2">
                  Start New Chat
                </Button>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto p-4 space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-3">
                    <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                      <p className="text-sm font-medium text-primary">You</p>
                      <p className="text-sm mt-1">{msg.content}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {msg.responses.map((resp, i) => (
                        <ModelResponseCard
                          key={resp.id}
                          model={resp.model}
                          content={resp.content}
                          status={resp.status as "loading" | "success" | "error"}
                          errorMessage={resp.error_message}
                          includedInSynthesis={resp.included_in_synthesis}
                          onToggleInclude={() => toggleInclude(resp.id, msg.id)}
                          colorIndex={i}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          {selectedChatId && (
            <PromptInput
              onSend={handleSend}
              onEnhance={handleEnhance}
              disabled={sending}
              enhancing={enhancing}
            />
          )}
        </div>
      </div>

      <NewProjectDialog
        open={showNewProject}
        onClose={() => setShowNewProject(false)}
        onSubmit={createProject}
      />
    </SidebarProvider>
  );
}
