import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUsage } from "@/hooks/useUsage";
import { usePreferences } from "@/hooks/usePreferences";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Save, User, BarChart3, Settings2 } from "lucide-react";
import { AI_CONFIG, CostMode } from "@/lib/aiConfig";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { totalCost, requestCount, isNearCap, isAtCap, loading: usageLoading } = useUsage();
  const { costMode, defaultModels, defaultLayout, loading: prefsLoading, savePreferences } = usePreferences();

  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));

  // Local state for preferences form
  const [localCostMode, setLocalCostMode] = useState<CostMode>(costMode);
  const [localLayout, setLocalLayout] = useState(defaultLayout);

  useEffect(() => { setLocalCostMode(costMode); }, [costMode]);
  useEffect(() => { setLocalLayout(defaultLayout); }, [defaultLayout]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).single().then(({ data }) => {
      if (data?.display_name) setDisplayName(data.display_name);
    });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("user_id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
    setSaving(false);
  };

  const handleSavePreferences = () => {
    savePreferences({ costMode: localCostMode, defaultLayout: localLayout });
  };

  const toggleTheme = (dark: boolean) => {
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  };

  const usagePercent = Math.min((totalCost / AI_CONFIG.limits.hardCapUsd) * 100, 100);
  const statusLabel = isAtCap ? "Limit Reached" : isNearCap ? "Near Limit" : "Normal";
  const statusColor = isAtCap ? "destructive" : isNearCap ? "secondary" : "default";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold font-['Space_Grotesk']">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Usage This Month</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estimated Spend</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">${totalCost.toFixed(4)}</span>
              <span className="text-xs text-muted-foreground">/ ${AI_CONFIG.limits.hardCapUsd.toFixed(2)}</span>
              <Badge variant={statusColor as any}>{statusLabel}</Badge>
            </div>
          </div>
          <Progress value={usagePercent} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Soft cap: ${AI_CONFIG.limits.softCapUsd.toFixed(2)}</span>
            <span>{requestCount} requests this month</span>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings2 className="h-4 w-4" /> Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <Label>Cost Mode</Label>
            <RadioGroup value={localCostMode} onValueChange={(v) => setLocalCostMode(v as CostMode)} className="flex gap-4">
              {(Object.entries(AI_CONFIG.costModes) as [CostMode, typeof AI_CONFIG.costModes.balanced][]).map(([key, mode]) => (
                <div key={key} className="flex items-center gap-2">
                  <RadioGroupItem value={key} id={`mode-${key}`} />
                  <Label htmlFor={`mode-${key}`} className="cursor-pointer text-sm">{mode.label}</Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              {localCostMode === "low_cost" && "Minimizes token spend. Limited models and shorter outputs."}
              {localCostMode === "balanced" && "Good balance of quality and cost. Most models available."}
              {localCostMode === "premium" && "All models enabled including expensive ones. Higher token limits."}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Default Layout</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" checked={localLayout === "grid"} onChange={() => setLocalLayout("grid")} className="accent-primary" />
                Grid
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" checked={localLayout === "stacked"} onChange={() => setLocalLayout("stacked")} className="accent-primary" />
                Stacked
              </label>
            </div>
          </div>

          <Button onClick={handleSavePreferences} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label>Dark Mode</Label>
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardContent className="p-6">
          <Button variant="outline" onClick={signOut} className="gap-1.5">Logout</Button>
        </CardContent>
      </Card>
    </div>
  );
}
