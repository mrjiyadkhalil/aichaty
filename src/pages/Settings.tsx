import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUsage } from "@/hooks/useUsage";
import { usePreferences } from "@/hooks/usePreferences";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Save, User, BarChart3, Settings2, Sun, Moon, Monitor, RotateCcw, Brain, MessageSquare, Crown, ShieldCheck } from "lucide-react";
import { AI_CONFIG, CostMode } from "@/lib/aiConfig";
import { MemoryManager } from "@/components/MemoryManager";
import { Textarea } from "@/components/ui/textarea";
import { PlanBadge } from "@/components/PlanBadge";
import { SessionManager } from "@/components/SessionManager";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { totalCost, requestCount, isNearCap, isAtCap } = useUsage();
  const { costMode, defaultLayout, theme: prefTheme, onboardingCompleted, savePreferences } = usePreferences();
  const { plan, features } = useSubscription();
  const { setTheme } = useTheme();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [localCostMode, setLocalCostMode] = useState<CostMode>(costMode);
  const [localLayout, setLocalLayout] = useState(defaultLayout);
  const [localTheme, setLocalTheme] = useState<"light" | "dark" | "system">(prefTheme);

  useEffect(() => { setLocalCostMode(costMode); }, [costMode]);
  useEffect(() => { setLocalLayout(defaultLayout); }, [defaultLayout]);
  useEffect(() => { setLocalTheme(prefTheme); }, [prefTheme]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, custom_system_prompt").eq("user_id", user.id).single().then(({ data }) => {
      if (data?.display_name) setDisplayName(data.display_name);
      if ((data as any)?.custom_system_prompt) setCustomSystemPrompt((data as any).custom_system_prompt);
    });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName, custom_system_prompt: customSystemPrompt } as any).eq("user_id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
    setSaving(false);
  };

  const handleSavePreferences = () => {
    setTheme(localTheme);
    savePreferences({ costMode: localCostMode, defaultLayout: localLayout, theme: localTheme });
  };

  const handleRestartTour = async () => {
    await savePreferences({ onboardingCompleted: false });
    toast.success("Onboarding tour will show on next page load");
    setTimeout(() => window.location.reload(), 500);
  };

  const softCap = features?.usage_cap_soft ?? AI_CONFIG.limits.softCapUsd;
  const hardCap = features?.usage_cap_hard ?? AI_CONFIG.limits.hardCapUsd;
  const usagePercent = Math.min((totalCost / hardCap) * 100, 100);
  const statusLabel = isAtCap ? "Limit Reached" : isNearCap ? "Near Limit" : "Normal";
  const statusColor = isAtCap ? "destructive" : isNearCap ? "secondary" : "default";

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      <h1 className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk']">Settings</h1>

      {/* Plan */}
      <div className="glass-card p-4 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2 font-['Space_Grotesk']"><Crown className="h-4 w-4 text-primary" /> Subscription Plan</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PlanBadge plan={plan} />
            <span className="text-sm text-muted-foreground capitalize">{plan} Plan</span>
          </div>
          {plan === "free" && (
            <Button size="sm" onClick={() => navigate("/pricing")} className="gap-1.5 shadow-glow-sm min-h-[44px] w-full sm:w-auto">
              <Crown className="h-3.5 w-3.5" /> Upgrade
            </Button>
          )}
          {plan !== "free" && (
            <Button variant="outline" size="sm" onClick={() => navigate("/pricing")} className="min-h-[44px] w-full sm:w-auto">
              Manage Plan
            </Button>
          )}
        </div>
      </div>

      {/* Profile */}
      <div className="glass-card p-4 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2 font-['Space_Grotesk']"><User className="h-4 w-4 text-primary" /> Profile</h2>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email || ""} disabled className="bg-background/30 border-border/30" />
        </div>
        <div className="space-y-2">
          <Label>Display Name</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-background/50 border-border/30 focus:border-primary/50" />
        </div>
        {plan === "pro" && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5 text-primary" /> Custom System Prompt</Label>
            <Textarea value={customSystemPrompt} onChange={(e) => setCustomSystemPrompt(e.target.value)} placeholder="Set a custom AI personality or instructions..." rows={3} className="bg-background/50 border-border/30 focus:border-primary/50" />
            <p className="text-xs text-muted-foreground">This prompt is prepended to every AI request.</p>
          </div>
        )}
        <Button onClick={handleSaveProfile} disabled={saving} className="gap-1.5 shadow-glow-sm min-h-[44px] w-full sm:w-auto"><Save className="h-3.5 w-3.5" /> Save</Button>
      </div>

      {/* AI Memory */}
      <div className="glass-card p-4 sm:p-6 space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2 font-['Space_Grotesk']"><Brain className="h-4 w-4 text-primary" /> AI Memory</h2>
        <p className="text-sm text-muted-foreground">The AI learns key facts about you from conversations.</p>
        <MemoryManager />
      </div>

      {/* Usage */}
      <div className="glass-card p-4 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2 font-['Space_Grotesk']"><BarChart3 className="h-4 w-4 text-primary" /> Usage This Month</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Estimated Spend</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">${totalCost.toFixed(4)}</span>
            <span className="text-xs text-muted-foreground">/ ${hardCap.toFixed(2)}</span>
            <Badge variant={statusColor as any}>{statusLabel}</Badge>
          </div>
        </div>
        <Progress value={usagePercent} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Soft cap: ${softCap.toFixed(2)}</span>
          <span>{requestCount} requests</span>
        </div>
      </div>

      {/* Sessions */}
      <div className="glass-card p-4 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2 font-['Space_Grotesk']"><ShieldCheck className="h-4 w-4 text-primary" /> Active Sessions</h2>
        <p className="text-sm text-muted-foreground">Manage your active sessions across devices.</p>
        <SessionManager />
      </div>

      {/* Preferences */}
      <div className="glass-card p-4 sm:p-6 space-y-5">
        <h2 className="text-base font-semibold flex items-center gap-2 font-['Space_Grotesk']"><Settings2 className="h-4 w-4 text-primary" /> Preferences</h2>

        {/* Theme */}
        <div className="space-y-3">
          <Label>Theme</Label>
          <div className="flex flex-wrap gap-2">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setLocalTheme(value)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg border text-sm transition-all min-h-[44px] ${
                  localTheme === value
                    ? "border-primary bg-primary/10 text-primary shadow-glow-sm"
                    : "border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cost Mode */}
        <div className="space-y-3">
          <Label>Cost Mode</Label>
          <RadioGroup value={localCostMode} onValueChange={(v) => setLocalCostMode(v as CostMode)} className="flex flex-wrap gap-4">
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

        {/* Layout */}
        <div className="space-y-2">
          <Label>Default Layout</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer min-h-[44px]">
              <input type="radio" checked={localLayout === "grid"} onChange={() => setLocalLayout("grid")} className="accent-primary" /> Grid
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer min-h-[44px]">
              <input type="radio" checked={localLayout === "stacked"} onChange={() => setLocalLayout("stacked")} className="accent-primary" /> Stacked
            </label>
          </div>
        </div>

        <Button onClick={handleSavePreferences} className="gap-1.5 shadow-glow-sm min-h-[44px] w-full sm:w-auto"><Save className="h-3.5 w-3.5" /> Save Preferences</Button>
      </div>

      {/* Onboarding */}
      <div className="glass-card p-4 sm:p-6 space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2 font-['Space_Grotesk']"><RotateCcw className="h-4 w-4 text-primary" /> Onboarding</h2>
        <p className="text-sm text-muted-foreground">Re-run the onboarding tour to learn about features.</p>
        <Button variant="outline" onClick={handleRestartTour} className="gap-1.5 border-border/50 hover:bg-secondary min-h-[44px]">
          <RotateCcw className="h-3.5 w-3.5" /> Restart Tour
        </Button>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="glass-card p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 text-xs font-mono rounded bg-muted/50 border border-border/50">Ctrl+/</kbd> anytime to view keyboard shortcuts.
        </p>
      </div>

      {/* Logout */}
      <div className="glass-card p-4 sm:p-6">
        <Button variant="outline" onClick={signOut} className="gap-1.5 border-border/50 hover:bg-secondary min-h-[44px] w-full sm:w-auto">Logout</Button>
      </div>
    </div>
  );
}
