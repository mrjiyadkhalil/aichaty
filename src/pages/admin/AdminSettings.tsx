import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, Wrench, Key } from "lucide-react";

interface ConfigItem {
  id: string;
  key: string;
  value_json: any;
  description: string | null;
}

const GROUPS: Record<string, { title: string; keys: string[] }> = {
  cost: { title: "Cost Controls", keys: ["soft_cap_usd", "hard_cap_usd", "default_cost_mode"] },
  limits: { title: "Request Limits", keys: ["max_models_per_request", "max_prompt_length", "max_synthesis_input_length"] },
  files: { title: "File Limits", keys: ["max_file_size_mb", "max_extracted_text_length"] },
  features: { title: "Feature Flags", keys: ["feature_export", "feature_share_links", "feature_onboarding", "feature_templates"] },
};

export default function AdminSettings() {
  const [config, setConfig] = useState<ConfigItem[]>([]);
  const [local, setLocal] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Maintenance mode
  const [maintenance, setMaintenance] = useState({ enabled: false, message: "", start_at: "", end_at: "" });
  const [savingMaint, setSavingMaint] = useState(false);

  // API Keys
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi("get_system_config"),
      adminApi("get_api_keys"),
    ]).then(([configData, keysData]) => {
      const items = configData.config || [];
      setConfig(items);
      const map: Record<string, any> = {};
      items.forEach((c: ConfigItem) => { map[c.key] = c.value_json; });
      setLocal(map);

      // Load maintenance config
      const maintConfig = items.find((c: ConfigItem) => c.key === "maintenance_mode");
      if (maintConfig?.value_json) {
        const mc = maintConfig.value_json as any;
        setMaintenance({
          enabled: mc.enabled || false,
          message: mc.message || "",
          start_at: mc.start_at || "",
          end_at: mc.end_at || "",
        });
      }

      setApiKeys(keysData.keys || []);
    }).catch(() => toast.error("Failed to load settings"))
      .finally(() => { setLoading(false); setLoadingKeys(false); });
  }, []);

  const handleSave = async (keys: string[]) => {
    setSaving(true);
    try {
      for (const key of keys) {
        if (local[key] !== undefined) {
          await adminApi("update_system_config", { key, value_json: local[key] });
        }
      }
      toast.success("Settings saved");
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  };

  const handleSaveMaintenance = async () => {
    setSavingMaint(true);
    try {
      await adminApi("update_system_config", {
        key: "maintenance_mode",
        value_json: maintenance,
      });
      toast.success("Maintenance settings saved");
    } catch { toast.error("Failed to save"); }
    setSavingMaint(false);
  };

  const handleUpdateApiKey = async (keyItem: any, newEnvName: string) => {
    try {
      await adminApi("update_api_key", { id: keyItem.id, env_key_name: newEnvName });
      toast.success("API key updated");
    } catch { toast.error("Failed to update"); }
  };

  const isBoolean = (key: string) => key.startsWith("feature_");

  if (loading) return <div className="p-6"><div className="h-64 animate-pulse bg-muted rounded-lg" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold font-['Space_Grotesk']">Global Settings</h1>

      {/* System config groups */}
      {Object.entries(GROUPS).map(([gKey, group]) => (
        <Card key={gKey}>
          <CardHeader><CardTitle className="text-base">{group.title}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {group.keys.map((key) => {
              const cfg = config.find((c) => c.key === key);
              if (!cfg) return null;
              if (isBoolean(key)) {
                return (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm">{cfg.description || key}</Label>
                    <Switch checked={local[key] === true || local[key] === "true"} onCheckedChange={(v) => setLocal((p) => ({ ...p, [key]: v }))} />
                  </div>
                );
              }
              return (
                <div key={key} className="space-y-1.5">
                  <Label className="text-sm">{cfg.description || key}</Label>
                  <Input
                    value={typeof local[key] === "string" ? local[key].replace(/^"|"$/g, "") : String(local[key] ?? "")}
                    onChange={(e) => {
                      const v = e.target.value;
                      const num = Number(v);
                      setLocal((p) => ({ ...p, [key]: isNaN(num) ? v : num }));
                    }}
                    className="max-w-xs"
                  />
                </div>
              );
            })}
            <Button size="sm" disabled={saving} onClick={() => handleSave(group.keys)} className="gap-1.5">
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4" /> Maintenance Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Maintenance Mode</Label>
            <Switch checked={maintenance.enabled} onCheckedChange={(v) => setMaintenance(m => ({ ...m, enabled: v }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Maintenance Message</Label>
            <Textarea
              placeholder="We're performing scheduled maintenance..."
              value={maintenance.message}
              onChange={(e) => setMaintenance(m => ({ ...m, message: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Time (optional)</Label>
              <Input type="datetime-local" value={maintenance.start_at} onChange={(e) => setMaintenance(m => ({ ...m, start_at: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>End Time (optional)</Label>
              <Input type="datetime-local" value={maintenance.end_at} onChange={(e) => setMaintenance(m => ({ ...m, end_at: e.target.value }))} />
            </div>
          </div>
          <Button size="sm" disabled={savingMaint} onClick={handleSaveMaintenance} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Save Maintenance Settings
          </Button>
        </CardContent>
      </Card>

      {/* API Key Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" /> Provider API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Manage the environment variable names used for each provider's API key. The actual secrets are stored securely in your backend.</p>
          {apiKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No API keys configured yet.</p>
          ) : (
            apiKeys.map((k: any) => (
              <div key={k.id} className="flex items-center gap-3">
                <Label className="w-32 shrink-0 capitalize">{k.provider_name}</Label>
                <Input
                  defaultValue={k.env_key_name}
                  className="max-w-xs font-mono text-xs"
                  onBlur={(e) => {
                    if (e.target.value !== k.env_key_name) handleUpdateApiKey(k, e.target.value);
                  }}
                />
                <span className={`text-xs ${k.is_set ? "text-green-500" : "text-muted-foreground"}`}>
                  {k.is_set ? "✓ Set" : "Not set"}
                </span>
              </div>
            ))
          )}
          <Button size="sm" variant="outline" onClick={async () => {
            try {
              await adminApi("init_default_api_keys");
              const keysData = await adminApi("get_api_keys");
              setApiKeys(keysData.keys || []);
              toast.success("Default API keys initialized");
            } catch { toast.error("Failed"); }
          }}>
            Initialize Default Keys
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
