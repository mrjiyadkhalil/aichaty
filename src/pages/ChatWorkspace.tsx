import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUsage } from "@/hooks/useUsage";
import { usePreferences } from "@/hooks/usePreferences";
import { useSubscription } from "@/hooks/useSubscription";
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
import { SavePromptButton } from "@/components/SavePromptButton";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { AI_CONFIG } from "@/lib/aiConfig";
import { pickBestModel } from "@/lib/autoRouter";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
  const { plan, features, canAccess, isModelAllowed } = useSubscription();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  const [upgradeRequiredPlan, setUpgradeRequiredPlan] = useState<"pro" | "enterprise">("pro");
  useEffect(() => { setLayout(defaultLayout); }, [defaultLayout]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const enabledModels = AI_CONFIG.costModes[costMode]?.enabledModels || AI_CONFIG.costModes.balanced.enabledModels;

  // Reset state when navigating to /chat (no chatId)
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setProjectId(null);
      setProjectName("");
      setProjectInstruction("");
      setProjectFiles([]);
      setImageBase64(null);
      setImageMimeType(null);
      setEnhancedPrompt(null);
      setSelectedModels(["google/gemini-3-flash-preview"]);
    }
  }, [chatId]);

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
      } else { setProjectName(""); setProjectInstruction(""); setProjectFiles([]); }
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
    if (!enabledModels.includes(modelId)) { toast.warning("Model not available in current cost mode"); return; }
    setSelectedModels((prev) => prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId]);
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds((prev) => prev.includes(fileId) ? prev.filter((f) => f !== fileId) : [...prev, fileId]);
  };

  const handleEnhance = async (prompt: string) => {
    if (!prompt.trim()) return;
    setEnhanceOriginal(prompt); setEnhancedPrompt(null); setShowEnhancer(true); setEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-prompt", { body: { prompt, projectInstruction: useInstruction ? projectInstruction : undefined, projectId, chatId } });
      if (error) throw error;
      setEnhancedPrompt(data?.enhanced || prompt);
    } catch (e: any) { toast.error(e.message || "Enhancement failed"); setEnhancedPrompt(prompt); }
    setEnhancing(false);
  };

  const streamResponse = async (model: string, fullPrompt: string, msgId: string, responseId: string, activeChatId: string, modeConfig: any, requestType: string) => {
    const start = Date.now();
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/multi-model-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ prompt: fullPrompt, model, projectId, chatId: activeChatId, messageId: msgId, max_tokens: modeConfig.maxOutputTokens, request_type: requestType, stream: true, ...(imageBase64 ? { image_base64: imageBase64, image_mime_type: imageMimeType } : {}) }),
      });
      if (!resp.ok || !resp.body) {
        const errText = await resp.text();
        let errorMsg = "AI model error";
        try { errorMsg = JSON.parse(errText).error || errorMsg; } catch {}
        throw new Error(errorMsg);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let textBuffer = "";
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, responses: m.responses.map((r) => r.id === responseId ? { ...r, status: "success", content: "" } : r) } : m));
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, idx);
          textBuffer = textBuffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              const captured = fullContent;
              setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, responses: m.responses.map((r) => r.id === responseId ? { ...r, content: captured } : r) } : m));
            }
          } catch {}
        }
      }
      const latency = Date.now() - start;
      await supabase.from("model_responses").update({ status: "success", content: fullContent, latency_ms: latency }).eq("id", responseId);
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, responses: m.responses.map((r) => r.id === responseId ? { ...r, content: fullContent, latency_ms: latency } : r) } : m));
    } catch (e: any) {
      const latency = Date.now() - start;
      await supabase.from("model_responses").update({ status: "error", error_message: e.message, latency_ms: latency }).eq("id", responseId);
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, responses: m.responses.map((r) => r.id === responseId ? { ...r, status: "error", error_message: e.message, latency_ms: latency } : r) } : m));
    }
  };

  const handleSend = async (prompt: string) => {
    if (!user) return;
    let activeChatId = chatId;
    if (!activeChatId) {
      const title = prompt.slice(0, 50) + (prompt.length > 50 ? "..." : "");
      const { data: newChat, error: chatErr } = await supabase.from("chats").insert({ user_id: user.id, title }).select().single();
      if (chatErr || !newChat) { toast.error("Failed to create chat"); return; }
      activeChatId = newChat.id;
      navigate(`/chat/${activeChatId}`, { replace: true });
    }
    if (isAtCap) { toast.error("Monthly usage limit reached."); return; }
    if (isNearCap) { toast.warning("Approaching usage limit"); }
    const modelsToUse = chatMode === "superfiesta" ? [pickBestModel(prompt, enabledModels)] : selectedModels;
    if (modelsToUse.length === 0) { toast.error("Select at least one model"); return; }
    setSending(true);
    let fileContext = "";
    if (selectedFileIds.length > 0) {
      const selectedFiles = projectFiles.filter((f) => selectedFileIds.includes(f.id));
      fileContext = selectedFiles.map((f) => `[File: ${f.file_name}]\n${f.extracted_text || "(no text)"}`).join("\n\n");
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
      const responseId = newMsg.responses.find((r) => r.model === model)?.id;
      if (!responseId) return;
      await streamResponse(model, fullPrompt, msg.id, responseId, activeChatId!, modeConfig, requestType);
    });
    await Promise.all(calls);
    setSending(false);
    setImageBase64(null);
    setImageMimeType(null);
    refreshUsage();
  };

  const handleRetry = async (messageId: string, model: string) => {
    if (isAtCap) { toast.error("Monthly usage limit reached"); return; }
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || !user) return;
    const resp = msg.responses.find((r) => r.model === model);
    if (!resp) return;
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, responses: m.responses.map((r) => r.model === model ? { ...r, status: "loading", content: null, error_message: null } : r) } : m));
    const modeConfig = AI_CONFIG.costModes[costMode] || AI_CONFIG.costModes.balanced;
    await streamResponse(model, msg.content, messageId, resp.id, chatId!, modeConfig, "retry");
    refreshUsage();
  };

  const toggleInclude = async (responseId: string, messageId: string) => {
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, responses: m.responses.map((r) => r.id === responseId ? { ...r, included_in_synthesis: !r.included_in_synthesis } : r) } : m));
    const msg = messages.find((m) => m.id === messageId);
    const resp = msg?.responses.find((r) => r.id === responseId);
    if (resp) { await supabase.from("model_responses").update({ included_in_synthesis: !resp.included_in_synthesis }).eq("id", responseId); }
  };

  const handleCopyMsg = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedMsg(id);
    setTimeout(() => setCopiedMsg(null), 2000);
  };

  const selectedFilesForComposer = projectFiles.filter((f) => selectedFileIds.includes(f.id)).map((f) => ({ id: f.id, name: f.file_name }));
  const hasMessages = messages.length > 0;
  const isSuperFiesta = chatMode === "superfiesta";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Multi-chat model bar */}
      {!isSuperFiesta && hasMessages && (
        <div className="relative z-20 shrink-0">
          <MultiChatColumns selectedModels={selectedModels} enabledModels={enabledModels} onToggleModel={toggleModel} compact />
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center min-h-full px-3 sm:px-4 py-8 sm:py-16">
            <ChatModeSwitcher mode={chatMode} onModeChange={(mode) => {
              if (mode === "multichat" && !canAccess("multi_chat")) {
                setUpgradeFeature("Multi-Chat Mode");
                setUpgradeRequiredPlan("pro");
                setShowUpgrade(true);
                return;
              }
              setChatMode(mode);
            }} />
            <div className="w-full mt-10">
              <SuperFiestaView onSend={handleSend} onEnhance={handleEnhance} onAttachFiles={projectId ? () => setShowFileModal(true) : undefined} disabled={sending} enhancing={enhancing} showGreeting={isSuperFiesta} onImageSelected={(b64, mime) => { setImageBase64(b64); setImageMimeType(mime); }} onImageRemoved={() => { setImageBase64(null); setImageMimeType(null); }} hasImage={!!imageBase64} />
            </div>
            <div className="w-full max-w-2xl mt-16">
              <ExploreSection />
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
            <div className="flex justify-center mb-2">
              <ChatModeSwitcher mode={chatMode} onModeChange={setChatMode} />
            </div>
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-4 animate-fade-in">
                {/* User message — right aligned, dark bubble */}
                <div className="flex justify-end" onMouseEnter={() => setHoveredMsg(msg.id)} onMouseLeave={() => setHoveredMsg(null)}>
                  <div className="relative max-w-[85%] sm:max-w-[70%]">
                    <div className="bg-card border border-border rounded-2xl rounded-br-md px-4 py-3">
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    {hoveredMsg === msg.id && (
                      <div className="absolute -bottom-7 right-0 flex items-center gap-1 animate-fade-in">
                        <SavePromptButton promptContent={msg.content} />
                        <button onClick={() => handleCopyMsg(msg.content, msg.id)} className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors duration-150">
                          {copiedMsg === msg.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </button>
                        <span className="text-[10px] text-muted-foreground/40">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI responses */}
                {isSuperFiesta ? (
                  <div className="max-w-full">
                    {msg.responses.map((resp) => (
                      <div key={resp.id}>
                        {resp.status === "loading" && (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                            <div className="h-4 w-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                            <span className="text-[13px]">Thinking...</span>
                          </div>
                        )}
                        {resp.status === "error" && (
                          <div className="text-destructive text-sm py-2">
                            <p>Error: {resp.error_message || "Something went wrong"}</p>
                            <button onClick={() => handleRetry(msg.id, resp.model)} className="text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors duration-150">Retry</button>
                          </div>
                        )}
                        {resp.status === "success" && (
                          <div className="py-1">
                            <div className="text-[11px] text-muted-foreground/50 mb-1.5 flex items-center gap-1.5">
                              <span>{AI_CONFIG.modelLabels[resp.model] || resp.model}</span>
                              {resp.latency_ms && <span>· {(resp.latency_ms / 1000).toFixed(1)}s</span>}
                            </div>
                            <div className="prose-dark">
                              <ReactMarkdown>{resp.content || ""}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <ResponseGrid layout={layout}>
                      {msg.responses.map((resp, i) => (
                        <ModelResponseCard key={resp.id} model={resp.model} content={resp.content} status={resp.status as "loading" | "success" | "error"} errorMessage={resp.error_message} includedInSynthesis={resp.included_in_synthesis} onToggleInclude={() => toggleInclude(resp.id, msg.id)} onRetry={() => handleRetry(msg.id, resp.model)} latencyMs={resp.latency_ms} colorIndex={i} responseId={resp.id} />
                      ))}
                    </ResponseGrid>
                    {msg.responses.some((r) => r.status === "success") && (
                      <SynthesisPanel messageId={msg.id} prompt={msg.content} responses={msg.responses.map((r) => ({ model: r.model, content: r.content || "", included: r.included_in_synthesis }))} existingSynthesis={msg.synthesis} onSynthesized={(content) => { setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, synthesis: content } : m)); }} />
                    )}
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {hasMessages && (
        <PromptComposer
          onSend={handleSend} onEnhance={handleEnhance}
          onAttachFiles={projectId ? () => setShowFileModal(true) : undefined}
          selectedModels={selectedModels} onToggleModel={toggleModel}
          selectedFiles={selectedFilesForComposer}
          onRemoveFile={(fid) => setSelectedFileIds((prev) => prev.filter((id) => id !== fid))}
          useProjectInstruction={useInstruction} onToggleInstruction={setUseInstruction}
          hasProjectInstruction={!!projectInstruction}
          disabled={sending} enhancing={enhancing} enabledModels={enabledModels} chatMode={chatMode}
          onImageSelected={(b64, mime) => { setImageBase64(b64); setImageMimeType(mime); }}
          onImageRemoved={() => { setImageBase64(null); setImageMimeType(null); }} hasImage={!!imageBase64}
        />
      )}

      <PromptEnhancerModal open={showEnhancer} onClose={() => setShowEnhancer(false)} originalPrompt={enhanceOriginal} enhancedPrompt={enhancedPrompt} loading={enhancing} onKeepOriginal={() => setShowEnhancer(false)} onUseEnhanced={(p) => { setShowEnhancer(false); handleSend(p); }} />
      {projectId && <FileContextModal open={showFileModal} onClose={() => setShowFileModal(false)} projectId={projectId} projectFiles={projectFiles} selectedFileIds={selectedFileIds} onToggleFile={toggleFileSelection} onFilesUploaded={async () => { const { data } = await supabase.from("project_files").select("*").eq("project_id", projectId); if (data) setProjectFiles(data as ProjectFile[]); }} />}
      <UpgradePrompt open={showUpgrade} onClose={() => setShowUpgrade(false)} feature={upgradeFeature} requiredPlan={upgradeRequiredPlan} />
    </div>
  );
}
