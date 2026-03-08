import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, TestTube, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminModelAdd() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const [form, setForm] = useState({
    model_name: "",
    short_label: "",
    provider_name: "custom",
    provider_url: "",
    api_key_env: "",
    cost_tier: "standard",
    max_output_tokens: 4096,
    timeout_seconds: 60,
    request_format: '{\n  "model": "{{model}}",\n  "messages": [{"role": "user", "content": "{{prompt}}"}],\n  "stream": false\n}',
    is_custom: true,
    premium_only: false,
    retry_enabled: true,
  });

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const handleTest = async () => {
    if (!form.provider_url || !form.model_name) {
      toast.error("Model name and provider URL are required for testing");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await adminApi("test_custom_model", {
        model_name: form.model_name,
        provider_url: form.provider_url,
        api_key_env: form.api_key_env,
        request_format: form.request_format,
      });
      setTestResult(res.success ? `✅ Connection successful (${res.latency_ms}ms)` : `❌ Failed: ${res.error}`);
    } catch (e: any) {
      setTestResult(`❌ Error: ${e.message}`);
    }
    setTesting(false);
  };

  const handleSave = async () => {
    if (!form.model_name || !form.provider_name) {
      toast.error("Model name and provider are required");
      return;
    }
    setSaving(true);
    try {
      let requestFormat = null;
      try { requestFormat = JSON.parse(form.request_format); } catch { requestFormat = null; }
      
      await adminApi("create_model_config", {
        model_name: form.model_name,
        short_label: form.short_label || null,
        provider_name: form.provider_name,
        provider_url: form.provider_url || null,
        api_key_env: form.api_key_env || null,
        cost_tier: form.cost_tier,
        max_output_tokens: form.max_output_tokens,
        timeout_seconds: form.timeout_seconds,
        request_format: requestFormat,
        is_custom: form.is_custom,
        premium_only: form.premium_only,
        retry_enabled: form.retry_enabled,
      });
      toast.success("Model created successfully");
      navigate("/admin/models");
    } catch (e: any) {
      toast.error(e.message || "Failed to create model");
    }
    setSaving(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/models")} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back to Models
      </Button>

      <h1 className="text-2xl font-bold font-['Space_Grotesk']">Add Custom Model</h1>

      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Model Name *</Label>
              <Input placeholder="custom/my-model" value={form.model_name} onChange={(e) => update("model_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Short Label</Label>
              <Input placeholder="My Model" value={form.short_label} onChange={(e) => update("short_label", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Provider</Label>
              <Select value={form.provider_name} onValueChange={(v) => update("provider_name", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cost Tier</Label>
              <Select value={form.cost_tier} onValueChange={(v) => update("cost_tier", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Provider URL</Label>
            <Input placeholder="https://api.example.com/v1/chat/completions" value={form.provider_url} onChange={(e) => update("provider_url", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>API Key ENV Name</Label>
            <Input placeholder="CUSTOM_MODEL_API_KEY" value={form.api_key_env} onChange={(e) => update("api_key_env", e.target.value)} />
            <p className="text-xs text-muted-foreground">The environment variable name that holds the API key for this model.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Max Output Tokens</Label>
              <Input type="number" value={form.max_output_tokens} onChange={(e) => update("max_output_tokens", parseInt(e.target.value) || 4096)} />
            </div>
            <div className="space-y-1.5">
              <Label>Timeout (seconds)</Label>
              <Input type="number" value={form.timeout_seconds} onChange={(e) => update("timeout_seconds", parseInt(e.target.value) || 60)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Request Format (JSON)</Label>
            <Textarea className="font-mono text-xs min-h-[120px]" value={form.request_format} onChange={(e) => update("request_format", e.target.value)} />
            <p className="text-xs text-muted-foreground">Use {"{{model}}"} and {"{{prompt}}"} as placeholders.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.premium_only} onCheckedChange={(v) => update("premium_only", v)} />
              <Label>Premium Only</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.retry_enabled} onCheckedChange={(v) => update("retry_enabled", v)} />
              <Label>Retry Enabled</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_custom} onCheckedChange={(v) => update("is_custom", v)} />
              <Label>Custom Endpoint</Label>
            </div>
          </div>

          {testResult && (
            <div className={`text-sm p-3 rounded-lg ${testResult.startsWith("✅") ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
              {testResult}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleTest} disabled={testing} className="gap-1.5">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
              Test Connection
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Model
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
