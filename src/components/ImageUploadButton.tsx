import { useState, useRef } from "react";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageUploadButtonProps {
  onImageSelected: (base64: string, mimeType: string) => void;
  onImageRemoved: () => void;
  hasImage: boolean;
  disabled?: boolean;
}

const MAX_SIZE = 4 * 1024 * 1024; // 4MB
const VISION_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function ImageUploadButton({ onImageSelected, onImageRemoved, hasImage, disabled }: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!VISION_TYPES.includes(file.type)) {
      toast.error("Unsupported image format. Use JPEG, PNG, GIF, or WebP.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image too large (max 4MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      onImageSelected(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
      {hasImage ? (
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-primary" onClick={onImageRemoved} disabled={disabled}>
          <X className="h-3.5 w-3.5" /> Image attached
        </Button>
      ) : (
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary" onClick={() => inputRef.current?.click()} disabled={disabled}>
          <ImageIcon className="h-3.5 w-3.5" /> Image
        </Button>
      )}
    </>
  );
}
