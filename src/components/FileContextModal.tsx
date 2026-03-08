import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, File, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ProjectFile { id: string; file_name: string; file_path: string; extracted_text: string | null; file_size: number | null; mime_type: string | null; }

interface FileContextModalProps {
  open: boolean; onClose: () => void; projectId: string;
  projectFiles: ProjectFile[]; selectedFileIds: string[];
  onToggleFile: (fileId: string) => void; onFilesUploaded: () => void;
}

const ACCEPT = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export function FileContextModal({ open, onClose, projectId, projectFiles, selectedFileIds, onToggleFile, onFilesUploaded }: FileContextModalProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    if (!user) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "docx", "txt"].includes(ext || "")) { toast.error(`Unsupported format: ${file.name}`); continue; }
      if (file.size > 20 * 1024 * 1024) { toast.error(`File too large: ${file.name} (max 20MB)`); continue; }
      const filePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("project-files").upload(filePath, file);
      if (uploadErr) { toast.error(`Upload failed: ${file.name}`); continue; }
      let extractedText: string | null = null;
      try { const { data } = await supabase.functions.invoke("extract-file-text", { body: { filePath, fileName: file.name, mimeType: file.type } }); extractedText = data?.extractedText || null; } catch {}
      const { error: dbErr } = await supabase.from("project_files").insert({ project_id: projectId, user_id: user.id, file_name: file.name, file_path: filePath, file_size: file.size, mime_type: file.type, extracted_text: extractedText });
      if (dbErr) toast.error(`Failed to save: ${file.name}`); else toast.success(`Uploaded: ${file.name}`);
    }
    setUploading(false);
    onFilesUploaded();
  }, [user, projectId, onFilesUploaded]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto glass-card border-border/30">
        <DialogHeader><DialogTitle className="font-['Space_Grotesk']">Attach File Context</DialogTitle></DialogHeader>
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${dragOver ? "border-primary bg-primary/5" : "border-border/30"}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files); }}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Uploading...</div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Drag & drop files or click to browse</p>
              <p className="text-xs text-muted-foreground">PDF, DOCX, TXT — max 20MB</p>
              <Button variant="outline" size="sm" className="mt-3 gap-1.5 border-border/50" asChild>
                <label className="cursor-pointer"><Upload className="h-3.5 w-3.5" />Upload File<input type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); }} /></label>
              </Button>
            </>
          )}
        </div>
        {projectFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Project Files</h3>
            {projectFiles.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-hover transition-colors">
                <Checkbox checked={selectedFileIds.includes(f.id)} onCheckedChange={() => onToggleFile(f.id)} />
                <File className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{f.file_name}</p>
                  <p className="text-xs text-muted-foreground">{f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : "Unknown"}{f.extracted_text ? " • Text extracted" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {projectFiles.length === 0 && !uploading && <p className="text-sm text-muted-foreground text-center py-4">No files uploaded yet</p>}
        <DialogFooter><Button onClick={onClose} className="shadow-glow-sm">Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
