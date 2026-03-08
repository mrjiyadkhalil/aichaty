import { useState } from "react";
import { Download, FileText, Copy, Check, Printer } from "lucide-react";
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

  const handleExportPdf = () => {
    const md = generateMarkdown();
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${projectName} Export</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.6}h1{border-bottom:2px solid #e5e5e5;padding-bottom:8px}h2{color:#333;margin-top:32px}h3{color:#555}blockquote{border-left:3px solid #ddd;margin-left:0;padding-left:16px;color:#666}hr{border:none;border-top:1px solid #e5e5e5;margin:24px 0}pre{background:#f5f5f5;padding:12px;border-radius:6px;overflow-x:auto}code{background:#f5f5f5;padding:2px 4px;border-radius:3px;font-size:0.9em}@media print{body{margin:0;padding:20px}}</style></head><body>${md.replace(/^# (.+)$/gm, '<h1>$1</h1>').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/_(.+?)_/g, '<em>$1</em>').replace(/^---$/gm, '<hr>').replace(/\n\n/g, '</p><p>').replace(/^/gm, '')}</body></html>`;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 300);
    }
    toast.success("PDF print dialog opened");
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
        <DropdownMenuItem onClick={handleExportPdf}>
          <Printer className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyAll}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          Copy All
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
