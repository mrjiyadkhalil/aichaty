import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function AdminFeatureFlags() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminApi("list_feature_flags")
      .then((d) => setFlags(d.flags || []))
      .catch(() => toast.error("Failed to load flags"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggle = async (flag: any) => {
    setToggling(flag.id);
    try {
      await adminApi("update_feature_flag", { id: flag.id, enabled: !flag.enabled });
      toast.success(`${flag.key} ${flag.enabled ? "disabled" : "enabled"}`);
      load();
    } catch { toast.error("Failed to update flag"); }
    setToggling(null);
  };

  if (loading) return <div className="p-6"><div className="h-64 animate-pulse bg-muted rounded-lg" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold font-['Space_Grotesk']">Feature Flags</h1>
      <div className="space-y-2">
        {flags.map((flag) => (
          <Card key={flag.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{flag.key}</p>
                <p className="text-xs text-muted-foreground">{flag.description || "No description"}</p>
                {flag.updated_at && (
                  <p className="text-xs text-muted-foreground mt-1">Updated: {new Date(flag.updated_at).toLocaleString()}</p>
                )}
              </div>
              <Switch
                checked={flag.enabled}
                onCheckedChange={() => toggle(flag)}
                disabled={toggling === flag.id}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
