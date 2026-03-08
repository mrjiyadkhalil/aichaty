import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Trash2, MessageSquare, Plus, FolderOpen, Upload, File, X } from "lucide-react";
import { FileContextModal } from "@/components/FileContextModal";
import { useIsMobile } from "@/hooks/use-mobile";

const AVAILABLE_MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", short: "G3F" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", short: "G2.5F" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", short: "G2.5P" },
  { id: "openai/gpt-5", label: "GPT-5", short: "GPT5" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", short: "GPT5m" },
  { id: "openai/gpt-5-nano", label: "GPT-5 Nano", short: "GPT5n" },
];

interface ProjectFile { id: string; file_name: string; file_path: string; extracted_text: string | null; file_size: number | null; mime_type: string | null; }

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [preferredModels, setPreferredModels] = useState<string[]>([]);
  const [chats, setChats] = useState<{ id: string; title: string | null; updated_at: string }[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      const { data: p } = await supabase.from("projects").select("*").eq("id", id).single();
      if (p) { setName(p.name); setDescription(p.description || ""); setCustomInstruction(p.custom_instruction || ""); setPreferredModels(p.preferred_models || []); }
      const { data: c } = await supabase.from("chats").select("id, title, updated_at").eq("project_id", id).order("updated_at", { ascending: false });
      if (c) setChats(c);
      const { data: f } = await supabase.from("project_files").select("*").eq("project_id", id).order("created_at", { ascending: false });
      if (f) setFiles(f as ProjectFile[]);
    };
    load();
  }, [id, user]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase.from("projects").update({ name, description, custom_instruction: customInstruction, preferred_models: preferredModels }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Project saved");
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!id || !confirm("Delete this project and all its chats?")) return;
    await supabase.from("projects").delete().eq("id", id);
    toast.success("Project deleted"); navigate("/chat");
  };

  const handleNewChat = async () => {
    if (!id || !user) return;
    const { data, error } = await supabase.from("chats").insert({ project_id: id, user_id: user.id, title: "New Chat" }).select().single();
    if (error) { toast.error(error.message); return; }
    if (data) navigate(`/chat/${data.id}`);
  };

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    await supabase.storage.from("project-files").remove([filePath]);
    await supabase.from("project_files").delete().eq("id", fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.success("File deleted");
  };

  const loadFiles = async () => {
    if (!id) return;
    const { data } = await supabase.from("project_files").select("*").eq("project_id", id).order("created_at", { ascending: false });
    if (data) setFiles(data as ProjectFile[]);
  };

  const toggleModel = (modelId: string) => {
    setPreferredModels((prev) => prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId]);
  };

  // Mobile: stacked layout
  if (isMobile) {
    return (
      <div className="h-full overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 sticky top-0 bg-background z-10">
          <h1 className="text-base font-semibold font-['Space_Grotesk'] flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" /> Project
          </h1>
          <div className="flex items-center gap-1">
            <Button size="sm" className="gap-1 h-8 text-xs shadow-glow-sm" onClick={handleNewChat}>
              <Plus className="h-3 w-3" /> Chat
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Settings */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Project Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background/50 border-border/30 focus:border-primary/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this project about?" rows={2} className="bg-background/50 border-border/30 focus:border-primary/50 resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Custom Instruction</Label>
              <Textarea value={customInstruction} onChange={(e) => setCustomInstruction(e.target.value)} placeholder="Special instructions..." rows={3} className="bg-background/50 border-border/30 focus:border-primary/50 resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Preferred Models</Label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_MODELS.map((m) => (
                  <Badge key={m.id} variant={preferredModels.includes(m.id) ? "default" : "outline"} className={`cursor-pointer select-none text-[11px] ${preferredModels.includes(m.id) ? "bg-primary text-primary-foreground shadow-glow-sm" : "border-border/50 text-muted-foreground hover:border-primary/50"}`} onClick={() => toggleModel(m.id)}>
                    {m.short}
                  </Badge>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} size="sm" className="w-full gap-1.5 shadow-glow-sm">
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
          </div>

          {/* Files */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <h2 className="text-sm font-semibold">Files</h2>
              <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => setShowFileModal(true)}>
                <Upload className="h-3 w-3" /> Upload
              </Button>
            </div>
            <div className="p-3">
              {files.length > 0 ? files.map((f) => (
                <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50">
                  <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <p className="text-xs truncate flex-1">{f.file_name}</p>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteFile(f.id, f.file_path)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )) : <p className="text-xs text-muted-foreground text-center py-4">No files</p>}
            </div>
          </div>

          {/* Chats */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <h2 className="text-sm font-semibold">Chats</h2>
            </div>
            <div className="p-3">
              {chats.length > 0 ? chats.map((c) => (
                <button key={c.id} onClick={() => navigate(`/chat/${c.id}`)} className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-secondary/50 text-left">
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{c.title || "New Chat"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.updated_at).toLocaleDateString()}</p>
                  </div>
                </button>
              )) : (
                <div className="text-center py-6">
                  <p className="text-xs text-muted-foreground mb-2">No chats yet</p>
                  <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleNewChat}>
                    <Plus className="h-3 w-3" /> Start Chat
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {id && <FileContextModal open={showFileModal} onClose={() => setShowFileModal(false)} projectId={id} projectFiles={files} selectedFileIds={[]} onToggleFile={() => {}} onFilesUploaded={loadFiles} />}
      </div>
    );
  }

  // Desktop: two-column layout
  return (
    <div className="h-full flex animate-fade-in">
      {/* Left side: Chats */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border/30">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <h2 className="text-lg font-semibold font-['Space_Grotesk'] flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Chats
          </h2>
          <Button size="sm" className="gap-1.5 shadow-glow-sm" onClick={handleNewChat}>
            <Plus className="h-3.5 w-3.5" /> New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {chats.length > 0 ? (
            <div className="space-y-1">
              {chats.map((c) => (
                <button key={c.id} onClick={() => navigate(`/chat/${c.id}`)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left">
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{c.title || "New Chat"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.updated_at).toLocaleDateString()}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No chats yet</p>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleNewChat}>
                <Plus className="h-3.5 w-3.5" /> Start a Chat
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Settings + Files */}
      <div className="w-[420px] shrink-0 flex flex-col overflow-y-auto bg-card/30">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <h1 className="text-lg font-semibold font-['Space_Grotesk'] flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" /> Project Settings
          </h1>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDelete} title="Delete Project">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4 border-b border-border/30">
          <div className="space-y-1.5">
            <Label className="text-xs">Project Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background/50 border-border/30 focus:border-primary/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this project about?" rows={2} className="bg-background/50 border-border/30 focus:border-primary/50 resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Custom Instruction</Label>
            <Textarea value={customInstruction} onChange={(e) => setCustomInstruction(e.target.value)} placeholder="Special instructions for AI models..." rows={3} className="bg-background/50 border-border/30 focus:border-primary/50 resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Preferred Models</Label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_MODELS.map((m) => (
                <Badge key={m.id} variant={preferredModels.includes(m.id) ? "default" : "outline"} className={`cursor-pointer select-none text-[11px] ${preferredModels.includes(m.id) ? "bg-primary text-primary-foreground shadow-glow-sm" : "border-border/50 text-muted-foreground hover:border-primary/50"}`} onClick={() => toggleModel(m.id)}>
                  {m.short}
                </Badge>
              ))}
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm" className="w-full gap-1.5 shadow-glow-sm">
            <Save className="h-3.5 w-3.5" /> Save Project
          </Button>
        </div>

        {/* Files */}
        <div className="flex-1">
          <div className="flex items-center justify-between px-6 py-3 border-b border-border/30">
            <h2 className="text-sm font-semibold font-['Space_Grotesk']">Files</h2>
            <Button variant="outline" size="sm" className="gap-1.5 border-border/50 h-7 text-xs" onClick={() => setShowFileModal(true)}>
              <Upload className="h-3 w-3" /> Upload
            </Button>
          </div>
          <div className="p-4">
            {files.length > 0 ? (
              <div className="space-y-1">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{f.file_name}</p>
                      <p className="text-[10px] text-muted-foreground">{f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : ""}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteFile(f.id, f.file_path)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">No files uploaded</p>
            )}
          </div>
        </div>
      </div>

      {id && <FileContextModal open={showFileModal} onClose={() => setShowFileModal(false)} projectId={id} projectFiles={files} selectedFileIds={[]} onToggleFile={() => {}} onFilesUploaded={loadFiles} />}
    </div>
  );
}
