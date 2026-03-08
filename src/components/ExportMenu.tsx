import { useState } from "react";
import { Download, FileText, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Message {
  content: string;
  enhanced_content?: string | null;
  created_at?: string;
  responses: { model: string; content: string | null; status: string; latency_ms?: number | null }[];
  synthesis?: string | null;
}

interface ExportMenuProps {
  messages: Message[];
  projectName: string;
  chatTitle?: string;
}

export function ExportMenu({ messages, projectName, chatTitle }: ExportMenuProps) {
  const [copied, setCopied] = useState(false);

  const generateMarkdown = () => {
    let md = `# ${projectName}${chatTitle ? ` — ${chatTitle}` : ""}\n\n`;
    md += `*Exported on ${new Date().toLocaleString()}*\n\n`;

    messages.forEach((msg, i) => {
      const ts = msg.created_at ? new Date(msg.created_at).toLocaleString() : "";
      md += `## Prompt ${i + 1}${ts ? ` (${ts})` : ""}\n\n${msg.content}\n\n`;
      if (msg.enhanced_content) {
        md += `> **Enhanced prompt:** ${msg.enhanced_content}\n\n`;
      }
      msg.responses.forEach((r) => {
        if (r.status === "success" && r.content) {
          const latency = r.latency_ms ? ` _(${(r.latency_ms / 1000).toFixed(1)}s)_` : "";
          md += `### ${r.model}${latency}\n\n${r.content}\n\n`;
        }
      });
      if (msg.synthesis) {
        md += `### 🏆 Synthesized Answer\n\n${msg.synthesis}\n\n`;
      }
      md += "---\n\n";
    });
    return md;
  };

  const handleExportMd = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, "-")}-export.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as Markdown");
  };

  const handleExportTxt = () => {
    const md = generateMarkdown().replace(/[#*_>]/g, "");
    const blob = new Blob([md], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, "-")}-export.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as text");
  };

  const handleCopyAll = async () => {
    const md = generateMarkdown();
    await navigator.clipboard.writeText(md);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (messages.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportMd}>
          <FileText className="h-4 w-4 mr-2" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportTxt}>
          <FileText className="h-4 w-4 mr-2" />
          Export as Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyAll}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          Copy All
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
