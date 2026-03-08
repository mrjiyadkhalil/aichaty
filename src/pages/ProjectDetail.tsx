import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Trash2, MessageSquare, Plus, FolderOpen, Upload, File, X } from "lucide-react";
import { FileContextModal } from "@/components/FileContextModal";

const AVAILABLE_MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", short: "G3F" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", short: "G2.5F" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", short: "G2.5P" },
  { id: "openai/gpt-5", label: "GPT-5", short: "GPT5" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", short: "GPT5m" },
  { id: "openai/gpt-5-nano", label: "GPT-5 Nano", short: "GPT5n" },
];

interface ProjectFile {
  id: string;
  file_name: string;
  file_path: string;
  extracted_text: string | null;
  file_size: number | null;
  mime_type: string | null;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
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
      if (p) {
        setName(p.name);
        setDescription(p.description || "");
        setCustomInstruction(p.custom_instruction || "");
        setPreferredModels(p.preferred_models || []);
      }
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
    const { error } = await supabase.from("projects").update({
      name, description, custom_instruction: customInstruction, preferred_models: preferredModels,
    }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Project saved");
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!id || !confirm("Delete this project and all its chats?")) return;
    await supabase.from("projects").delete().eq("id", id);
    toast.success("Project deleted");
    navigate("/dashboard");
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
    setPreferredModels((prev) =>
      prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-primary" />
          Edit Project
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1.5">
            <Trash2 className="h-3.5 w-3.5" /> Delete Project
          </Button>
        </div>
      </div>

      {/* Settings */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Project Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this project about?" />
          </div>
          <div className="space-y-2">
            <Label>Custom Instruction</Label>
            <Textarea value={customInstruction} onChange={(e) => setCustomInstruction(e.target.value)} placeholder="Special instructions for AI models in this project..." className="min-h-[100px]" />
          </div>
          <div className="space-y-2">
            <Label>Preferred Models</Label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_MODELS.map((m) => (
                <Badge key={m.id} variant={preferredModels.includes(m.id) ? "default" : "outline"} className="cursor-pointer select-none" onClick={() => toggleModel(m.id)}>
                  {m.short}
                </Badge>
              ))}
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Save Project
          </Button>
        </CardContent>
      </Card>

      {/* Files */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-['Space_Grotesk']">Files</CardTitle>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowFileModal(true)}>
            <Upload className="h-3.5 w-3.5" /> Upload File
          </Button>
        </CardHeader>
        <CardContent>
          {files.length > 0 ? (
            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{f.file_name}</p>
                    <p className="text-xs text-muted-foreground">{f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : ""}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteFile(f.id, f.file_path)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No files uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Chats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-['Space_Grotesk']">Chats</CardTitle>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleNewChat}>
            <Plus className="h-3.5 w-3.5" /> New Chat
          </Button>
        </CardHeader>
        <CardContent>
          {chats.length > 0 ? (
            <div className="space-y-1">
              {chats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/chat/${c.id}`)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{c.title || "New Chat"}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No chats yet</p>
          )}
        </CardContent>
      </Card>

      {id && (
        <FileContextModal
          open={showFileModal}
          onClose={() => setShowFileModal(false)}
          projectId={id}
          projectFiles={files}
          selectedFileIds={[]}
          onToggleFile={() => {}}
          onFilesUploaded={loadFiles}
        />
      )}
    </div>
  );
}
