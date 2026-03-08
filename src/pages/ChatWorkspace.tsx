import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUsage } from "@/hooks/useUsage";
import { usePreferences } from "@/hooks/usePreferences";
import { supabase } from "@/integrations/supabase/client";
import { PromptComposer } from "@/components/PromptComposer";
import { ModelResponseCard } from "@/components/ModelResponseCard";
import { ResponseGrid } from "@/components/ResponseGrid";
import { SynthesisPanel } from "@/components/SynthesisPanel";
import { PromptEnhancerModal } from "@/components/PromptEnhancerModal";
import { FileContextModal } from "@/components/FileContextModal";
import { ChatModeSwitcher } from "@/components/ChatModeSwitcher";
import { SuperFiestaView } from "@/components/SuperFiestaView";
import { MultiChatColumns } from "@/components/MultiChatColumns";
import { ExploreSection } from "@/components/ExploreSection";
import { AI_CONFIG } from "@/lib/aiConfig";
import { pickBestModel } from "@/lib/autoRouter";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface ProjectFile { id: string; file_name: string; file_path: string; extracted_text: string | null; file_size: number | null; mime_type: string | null; }
interface ModelResponse { id: string; model: string; content: string | null; status: string; error_message: string | null; included_in_synthesis: boolean; latency_ms: number | null; }
interface MessageWithResponses { id: string; content: string; enhanced_content: string | null; final_content: string | null; created_at: string; responses: ModelResponse[]; synthesis: string | null; }

export type ChatMode = "superfiesta" | "multichat";

export default function ChatWorkspace() {
  const { id: chatId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAtCap, isNearCap, refresh: refreshUsage } = useUsage();
  const { costMode, defaultLayout } = usePreferences();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectInstruction, setProjectInstruction] = useState("");
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [messages, setMessages] = useState<MessageWithResponses[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>(["google/gemini-3-flash-preview"]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [useInstruction, setUseInstruction] = useState(true);
  const [sending, setSending] = useState(false);
  const [layout, setLayout] = useState<"grid" | "stacked">("grid");
  const [showEnhancer, setShowEnhancer] = useState(false);
  const [enhanceOriginal, setEnhanceOriginal] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("superfiesta");

  useEffect(() => { setLayout(defaultLayout); }, [defaultLayout]);

  const enabledModels = AI_CONFIG.costModes[costMode]?.enabledModels || AI_CONFIG.costModes.balanced.enabledModels;

  useEffect(() => {
    if (!chatId || !user) return;
    const load = async () => {
      const { data: chat } = await supabase.from("chats").select("project_id, title").eq("id", chatId).single();
      if (!chat) { navigate("/chat", { replace: true }); return; }
      
      const chatProjectId = chat.project_id;
      setProjectId(chatProjectId);
      
      if (chatProjectId) {
        const { data: project } = await supabase.from("projects").select("name, custom_instruction, preferred_models").eq("id", chatProjectId).single();
        if (project) {
          setProjectName(project.name);
          setProjectInstruction(project.custom_instruction || "");
          if (project.preferred_models?.length) setSelectedModels(project.preferred_models.filter((m: string) => enabledModels.includes(m)));
        }
        const { data: files } = await supabase.from("project_files").select("*").eq("project_id", chatProjectId);
        if (files) setProjectFiles(files as ProjectFile[]);
      } else {
        setProjectName("");
        setProjectInstruction("");
        setProjectFiles([]);
      }
      
      const { data: msgs } = await supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
      if (!msgs) return;
      const loaded: MessageWithResponses[] = [];
      for (const msg of msgs) {
        const { data: responses } = await supabase.from("model_responses").select("*").eq("message_id", msg.id);
        const { data: synth } = await supabase.from("synthesis_results").select("content").eq("message_id", msg.id).maybeSingle();
        loaded.push({
          id: msg.id, content: msg.content, enhanced_content: (msg as any).enhanced_content || null,
          final_content: (msg as any).final_content || null, created_at: msg.created_at,
          responses: (responses || []).map((r: any) => ({ id: r.id, model: r.model, content: r.content, status: r.status, error_message: r.error_message, included_in_synthesis: r.included_in_synthesis ?? true, latency_ms: r.latency_ms || null })),
          synthesis: synth?.content || null,
        });
      }
      setMessages(loaded);
    };
    load();
  }, [chatId, user, navigate]);

  const toggleModel = (modelId: string) => {
    if (!enabledModels.includes(modelId)) { toast.warning("This model is not available in your current cost mode"); return; }
    setSelectedModels((prev) => prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId]);
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds((prev) => prev.includes(fileId) ? prev.filter((f) => f !== fileId) : [...prev, fileId]);
  };

  const handleEnhance = async (prompt: string) => {
    if (!prompt.trim()) return;
    setEnhanceOriginal(prompt); setEnhancedPrompt(null); setShowEnhancer(true); setEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-prompt", {
        body: { prompt, projectInstruction: useInstruction ? projectInstruction : undefined, projectId, chatId },
      });
      if (error) throw error;
      setEnhancedPrompt(data?.enhanced || prompt);
    } catch (e: any) { toast.error(e.message || "Enhancement failed"); setEnhancedPrompt(prompt); }
    setEnhancing(false);
  };

  const handleSend = async (prompt: string) => {
    if (!user) return;
    
    // If no chatId, create a new chat first and redirect
    let activeChatId = chatId;
    if (!activeChatId) {
      const title = prompt.slice(0, 50) + (prompt.length > 50 ? "..." : "");
      const { data: newChat, error: chatErr } = await supabase.from("chats").insert({ user_id: user.id, title }).select().single();
      if (chatErr || !newChat) { toast.error("Failed to create chat"); return; }
      activeChatId = newChat.id;
      navigate(`/chat/${activeChatId}`, { replace: true });
    }
    
    if (isAtCap) { toast.error("Monthly usage limit reached. Check Settings for details."); return; }
    if (isNearCap) { toast.warning("Approaching usage limit"); }

    // Determine models based on chat mode
    const modelsToUse = chatMode === "superfiesta"
      ? [pickBestModel(prompt, enabledModels)]
      : selectedModels;

    if (modelsToUse.length === 0) { toast.error("Select at least one model"); return; }

    setSending(true);
    let fileContext = "";
    if (selectedFileIds.length > 0) {
      const selectedFiles = projectFiles.filter((f) => selectedFileIds.includes(f.id));
      fileContext = selectedFiles.map((f) => `[File: ${f.file_name}]\n${f.extracted_text || "(no text extracted)"}`).join("\n\n");
    }
    const fullPrompt = [useInstruction && projectInstruction ? `[Project Instruction]: ${projectInstruction}` : "", fileContext ? `[File Context]:\n${fileContext}` : "", prompt].filter(Boolean).join("\n\n");
    const { data: msg, error: msgErr } = await supabase.from("messages").insert({ chat_id: activeChatId, user_id: user.id, content: prompt }).select().single();
    if (msgErr || !msg) { toast.error("Failed to save message"); setSending(false); return; }
    const placeholders = modelsToUse.map((model) => ({ message_id: msg.id, user_id: user.id, model, status: "loading" as const, content: null, error_message: null, included_in_synthesis: true }));
    const { data: responseRows } = await supabase.from("model_responses").insert(placeholders).select();
    const newMsg: MessageWithResponses = {
      id: msg.id, content: msg.content, enhanced_content: null, final_content: null,
      created_at: msg.created_at, synthesis: null,
      responses: (responseRows || []).map((r: any) => ({ id: r.id, model: r.model, content: r.content, status: r.status, error_message: r.error_message, included_in_synthesis: r.included_in_synthesis ?? true, latency_ms: null })),
    };
    setMessages((prev) => [...prev, newMsg]);
    const modeConfig = AI_CONFIG.costModes[costMode] || AI_CONFIG.costModes.balanced;
    const requestType = chatMode === "superfiesta" ? "auto_route" : "model_compare";
    const calls = modelsToUse.map(async (model) => {
      const start = Date.now();
      try {
        const resp = await supabase.functions.invoke("multi-model-chat", { body: { prompt: fullPrompt, model, projectId, chatId: activeChatId, messageId: msg.id, max_tokens: modeConfig.maxOutputTokens, request_type: requestType } });
        const latency = Date.now() - start;
        const responseId = newMsg.responses.find((r) => r.model === model)?.id;
        if (!responseId) return;
        if (resp.error) {
          await supabase.from("model_responses").update({ status: "error", error_message: resp.error.message, latency_ms: latency }).eq("id", responseId);
          setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, responses: m.responses.map((r) => r.model === model ? { ...r, status: "error", error_message: resp.error.message, latency_ms: latency } : r) } : m));
        } else {
          const aiContent = resp.data?.content || "No response";
          if (resp.data?.warning) toast.warning(resp.data.warning);
          await supabase.from("model_responses").update({ status: "success", content: aiContent, latency_ms: latency }).eq("id", responseId);
          setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, responses: m.responses.map((r) => r.model === model ? { ...r, status: "success", content: aiContent, latency_ms: latency } : r) } : m));
        }
      } catch (e: any) {
        const latency = Date.now() - start;
        const responseId = newMsg.responses.find((r) => r.model === model)?.id;
        if (responseId) {
          await supabase.from("model_responses").update({ status: "error", error_message: e.message, latency_ms: latency }).eq("id", responseId);
          setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, responses: m.responses.map((r) => r.model === model ? { ...r, status: "error", error_message: e.message, latency_ms: latency } : r) } : m));
        }
      }
    });
    await Promise.all(calls);
    setSending(false);
    refreshUsage();
  };

  const handleRetry = async (messageId: string, model: string) => {
    if (isAtCap) { toast.error("Monthly usage limit reached"); return; }
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || !user) return;
    const resp = msg.responses.find((r) => r.model === model);
    if (!resp) return;
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, responses: m.responses.map((r) => r.model === model ? { ...r, status: "loading", content: null, error_message: null } : r) } : m));
    const start = Date.now();
    try {
      const result = await supabase.functions.invoke("multi-model-chat", { body: { prompt: msg.content, model, projectId, chatId, messageId, request_type: "retry" } });
      const latency = Date.now() - start;
      if (result.error) throw result.error;
      const content = result.data?.content || "No response";
      await supabase.from("model_responses").update({ status: "success", content, latency_ms: latency, error_message: null }).eq("id", resp.id);
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, responses: m.responses.map((r) => r.model === model ? { ...r, status: "success", content, latency_ms: latency } : r) } : m));
    } catch (e: any) {
      const latency = Date.now() - start;
      await supabase.from("model_responses").update({ status: "error", error_message: e.message, latency_ms: latency }).eq("id", resp.id);
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, responses: m.responses.map((r) => r.model === model ? { ...r, status: "error", error_message: e.message, latency_ms: latency } : r) } : m));
    }
    refreshUsage();
  };

  const toggleInclude = async (responseId: string, messageId: string) => {
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, responses: m.responses.map((r) => r.id === responseId ? { ...r, included_in_synthesis: !r.included_in_synthesis } : r) } : m));
    const msg = messages.find((m) => m.id === messageId);
    const resp = msg?.responses.find((r) => r.id === responseId);
    if (resp) { await supabase.from("model_responses").update({ included_in_synthesis: !resp.included_in_synthesis }).eq("id", responseId); }
  };

  const selectedFilesForComposer = projectFiles.filter((f) => selectedFileIds.includes(f.id)).map((f) => ({ id: f.id, name: f.file_name }));

  const hasMessages = messages.length > 0;
  const isSuperFiesta = chatMode === "superfiesta";

  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/[0.04] rounded-full blur-[120px]" />
      </div>


      <div className="flex-1 overflow-y-auto relative z-10">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-8">
            <ChatModeSwitcher mode={chatMode} onModeChange={setChatMode} />
            <AnimatePresence mode="wait">
              {isSuperFiesta ? (
                <motion.div key="superfiesta" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="w-full max-w-3xl mt-8">
                  <SuperFiestaView onSend={handleSend} onEnhance={handleEnhance} onAttachFiles={projectId ? () => setShowFileModal(true) : undefined} disabled={sending} enhancing={enhancing} />
                </motion.div>
              ) : (
                <motion.div key="multichat" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} className="w-full mt-8">
                  <MultiChatColumns selectedModels={selectedModels} enabledModels={enabledModels} onToggleModel={toggleModel} onSend={handleSend} onEnhance={handleEnhance} onAttachFiles={projectId ? () => setShowFileModal(true) : undefined} disabled={sending} enhancing={enhancing} />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="w-full max-w-4xl mt-12">
              <ExploreSection />
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto p-4 space-y-6">
            <div className="flex justify-center">
              <ChatModeSwitcher mode={chatMode} onModeChange={setChatMode} />
            </div>
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-4 animate-fade-in">
                <div className="glass-card p-4 border-l-2 border-l-primary/40">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-primary font-['Space_Grotesk']">You</p>
                    <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm mt-1.5">{msg.content}</p>
                  {msg.enhanced_content && (
                    <p className="text-xs text-muted-foreground mt-1.5 italic">Enhanced: {msg.enhanced_content.slice(0, 100)}...</p>
                  )}
                </div>

                {/* Super Fiesta: single clean response. Multi-Chat: grid comparison */}
                {isSuperFiesta ? (
                  <div className="max-w-3xl">
                    {msg.responses.map((resp) => (
                      <div key={resp.id} className="glass-card p-4">
                        {resp.status === "loading" && (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <div className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                            Thinking...
                          </div>
                        )}
                        {resp.status === "error" && (
                          <div className="text-destructive text-sm">
                            <p>Error: {resp.error_message || "Something went wrong"}</p>
                            <button onClick={() => handleRetry(msg.id, resp.model)} className="text-xs text-primary hover:underline mt-1">Retry</button>
                          </div>
                        )}
                        {resp.status === "success" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Zap className="h-3 w-3 text-primary/60" />
                              <span>{AI_CONFIG.modelLabels[resp.model] || resp.model}</span>
                              {resp.latency_ms && <span>· {(resp.latency_ms / 1000).toFixed(1)}s</span>}
                            </div>
                            <div className="text-sm whitespace-pre-wrap">{resp.content}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <ResponseGrid layout={layout}>
                      {msg.responses.map((resp, i) => (
                        <ModelResponseCard key={resp.id} model={resp.model} content={resp.content} status={resp.status as "loading" | "success" | "error"} errorMessage={resp.error_message} includedInSynthesis={resp.included_in_synthesis} onToggleInclude={() => toggleInclude(resp.id, msg.id)} onRetry={() => handleRetry(msg.id, resp.model)} latencyMs={resp.latency_ms} colorIndex={i} />
                      ))}
                    </ResponseGrid>
                    {msg.responses.some((r) => r.status === "success") && (
                      <SynthesisPanel messageId={msg.id} prompt={msg.content} responses={msg.responses.map((r) => ({ model: r.model, content: r.content || "", included: r.included_in_synthesis }))} existingSynthesis={msg.synthesis} onSynthesized={(content) => { setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, synthesis: content } : m)); }} />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {hasMessages && (
        <PromptComposer
          onSend={handleSend}
          onEnhance={handleEnhance}
          onAttachFiles={projectId ? () => setShowFileModal(true) : undefined}
          selectedModels={selectedModels}
          onToggleModel={toggleModel}
          selectedFiles={selectedFilesForComposer}
          onRemoveFile={(fid) => setSelectedFileIds((prev) => prev.filter((id) => id !== fid))}
          useProjectInstruction={useInstruction}
          onToggleInstruction={setUseInstruction}
          hasProjectInstruction={!!projectInstruction}
          disabled={sending}
          enhancing={enhancing}
          enabledModels={enabledModels}
          chatMode={chatMode}
        />
      )}

      <PromptEnhancerModal open={showEnhancer} onClose={() => setShowEnhancer(false)} originalPrompt={enhanceOriginal} enhancedPrompt={enhancedPrompt} loading={enhancing} onKeepOriginal={() => setShowEnhancer(false)} onUseEnhanced={(p) => { setShowEnhancer(false); handleSend(p); }} />
      {projectId && <FileContextModal open={showFileModal} onClose={() => setShowFileModal(false)} projectId={projectId} projectFiles={projectFiles} selectedFileIds={selectedFileIds} onToggleFile={toggleFileSelection} onFilesUploaded={async () => { const { data } = await supabase.from("project_files").select("*").eq("project_id", projectId); if (data) setProjectFiles(data as ProjectFile[]); }} />}
    </div>
  );
}
