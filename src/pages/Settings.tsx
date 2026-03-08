import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUsage } from "@/hooks/useUsage";
import { usePreferences } from "@/hooks/usePreferences";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Save, User, BarChart3, Settings2 } from "lucide-react";
import { AI_CONFIG, CostMode } from "@/lib/aiConfig";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { totalCost, requestCount, isNearCap, isAtCap } = useUsage();
  const { costMode, defaultLayout, savePreferences } = usePreferences();

  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
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

  const handleSavePreferences = () => { savePreferences({ costMode: localCostMode, defaultLayout: localLayout }); };

  const usagePercent = Math.min((totalCost / AI_CONFIG.limits.hardCapUsd) * 100, 100);
  const statusLabel = isAtCap ? "Limit Reached" : isNearCap ? "Near Limit" : "Normal";
  const statusColor = isAtCap ? "destructive" : isNearCap ? "secondary" : "default";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold font-['Space_Grotesk']">Settings</h1>

      {/* Profile */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2 font-['Space_Grotesk']"><User className="h-4 w-4 text-primary" /> Profile</h2>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email || ""} disabled className="bg-background/30 border-border/30" />
        </div>
        <div className="space-y-2">
          <Label>Display Name</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-background/50 border-border/30 focus:border-primary/50" />
        </div>
        <Button onClick={handleSaveProfile} disabled={saving} className="gap-1.5 shadow-glow-sm"><Save className="h-3.5 w-3.5" /> Save</Button>
      </div>

      {/* Usage */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2 font-['Space_Grotesk']"><BarChart3 className="h-4 w-4 text-primary" /> Usage This Month</h2>
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
      </div>

      {/* Preferences */}
      <div className="glass-card p-6 space-y-5">
        <h2 className="text-base font-semibold flex items-center gap-2 font-['Space_Grotesk']"><Settings2 className="h-4 w-4 text-primary" /> Preferences</h2>
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
              <input type="radio" checked={localLayout === "grid"} onChange={() => setLocalLayout("grid")} className="accent-primary" /> Grid
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" checked={localLayout === "stacked"} onChange={() => setLocalLayout("stacked")} className="accent-primary" /> Stacked
            </label>
          </div>
        </div>
        <Button onClick={handleSavePreferences} className="gap-1.5 shadow-glow-sm"><Save className="h-3.5 w-3.5" /> Save Preferences</Button>
      </div>

      {/* Logout */}
      <div className="glass-card p-6">
        <Button variant="outline" onClick={signOut} className="gap-1.5 border-border/50 hover:bg-secondary">Logout</Button>
      </div>
    </div>
  );
}
