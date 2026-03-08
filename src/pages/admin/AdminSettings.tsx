import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save } from "lucide-react";

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

  useEffect(() => {
    adminApi("get_system_config")
      .then((d) => {
        const items = d.config || [];
        setConfig(items);
        const map: Record<string, any> = {};
        items.forEach((c: ConfigItem) => { map[c.key] = c.value_json; });
        setLocal(map);
      })
      .catch(() => toast.error("Failed to load config"))
      .finally(() => setLoading(false));
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

  const isBoolean = (key: string) => key.startsWith("feature_");

  if (loading) return <div className="p-6"><div className="h-64 animate-pulse bg-muted rounded-lg" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold font-['Space_Grotesk']">Global Settings</h1>

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
                    <div>
                      <Label className="text-sm">{cfg.description || key}</Label>
                    </div>
                    <Switch
                      checked={local[key] === true || local[key] === "true"}
                      onCheckedChange={(v) => setLocal((p) => ({ ...p, [key]: v }))}
                    />
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
    </div>
  );
}
