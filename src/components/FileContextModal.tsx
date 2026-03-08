import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, File, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ProjectFile {
  id: string;
  file_name: string;
  file_path: string;
  extracted_text: string | null;
  file_size: number | null;
  mime_type: string | null;
}

interface FileContextModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectFiles: ProjectFile[];
  selectedFileIds: string[];
  onToggleFile: (fileId: string) => void;
  onFilesUploaded: () => void;
}

const ACCEPT = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export function FileContextModal({
  open,
  onClose,
  projectId,
  projectFiles,
  selectedFileIds,
  onToggleFile,
  onFilesUploaded,
}: FileContextModalProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    if (!user) return;
    setUploading(true);
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "docx", "txt"].includes(ext || "")) {
        toast.error(`Unsupported format: ${file.name}`);
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`File too large: ${file.name} (max 20MB)`);
        continue;
      }

      const filePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("project-files")
        .upload(filePath, file);

      if (uploadErr) {
        toast.error(`Upload failed: ${file.name}`);
        continue;
      }

      // Extract text
      let extractedText: string | null = null;
      try {
        const { data } = await supabase.functions.invoke("extract-file-text", {
          body: { filePath, fileName: file.name, mimeType: file.type },
        });
        extractedText = data?.extractedText || null;
      } catch {
        // Text extraction optional
      }

      const { error: dbErr } = await supabase.from("project_files").insert({
        project_id: projectId,
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        extracted_text: extractedText,
      });

      if (dbErr) {
        toast.error(`Failed to save: ${file.name}`);
      } else {
        toast.success(`Uploaded: ${file.name}`);
      }
    }

    setUploading(false);
    onFilesUploaded();
  }, [user, projectId, onFilesUploaded]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-['Space_Grotesk']">Attach File Context</DialogTitle>
        </DialogHeader>

        {/* Upload zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Uploading...
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Drag & drop files or click to browse</p>
              <p className="text-xs text-muted-foreground">PDF, DOCX, TXT — max 20MB</p>
              <input
                type="file"
                accept={ACCEPT}
                multiple
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileInput}
                style={{ position: "relative" }}
              />
              <Button variant="outline" size="sm" className="mt-3 gap-1.5" asChild>
                <label className="cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  Upload File
                  <input type="file" accept={ACCEPT} multiple className="hidden" onChange={handleFileInput} />
                </label>
              </Button>
            </>
          )}
        </div>

        {/* File list */}
        {projectFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Project Files</h3>
            {projectFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedFileIds.includes(f.id)}
                  onCheckedChange={() => onToggleFile(f.id)}
                />
                <File className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{f.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : "Unknown size"}
                    {f.extracted_text ? " • Text extracted" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {projectFiles.length === 0 && !uploading && (
          <p className="text-sm text-muted-foreground text-center py-4">No files uploaded yet</p>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
