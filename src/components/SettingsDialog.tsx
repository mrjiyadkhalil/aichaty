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
import {
  Save, User, BarChart3, Settings, Sun, Moon, Monitor,
  RotateCcw, Brain, MessageSquare, Crown, ShieldCheck, ToggleRight,
} from "lucide-react";
import { AI_CONFIG, CostMode } from "@/lib/aiConfig";
import { MemoryManager } from "@/components/MemoryManager";
import { Textarea } from "@/components/ui/textarea";
import { PlanBadge } from "@/components/PlanBadge";
import { SessionManager } from "@/components/SessionManager";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SettingsDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "preferences", label: "AI Preferences", icon: ToggleRight },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "subscription", label: "Subscription", icon: Crown },
  { id: "profile", label: "Profile", icon: User },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsDialog({ trigger, open, onOpenChange }: SettingsDialogProps) {
  const { user, signOut } = useAuth();
  const { totalCost, totalTokens, requestCount, messagesUsedToday, isNearCap, isAtCap } = useUsage();
  const { costMode, defaultLayout, theme: prefTheme, savePreferences } = usePreferences();
  const { plan, features } = useSubscription();
  const { setTheme } = useTheme();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [localCostMode, setLocalCostMode] = useState<CostMode>(costMode);
  const [localLayout, setLocalLayout] = useState(defaultLayout);
  const [localTheme, setLocalTheme] = useState<"light" | "dark" | "system">(prefTheme);
  const [activeTab, setActiveTab] = useState<TabId>("general");

  useEffect(() => { setLocalCostMode(costMode); }, [costMode]);
  useEffect(() => { setLocalLayout(defaultLayout); }, [defaultLayout]);
  useEffect(() => { setLocalTheme(prefTheme); }, [prefTheme]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, custom_system_prompt")
      .eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
        if ((data as any)?.custom_system_prompt) setCustomSystemPrompt((data as any).custom_system_prompt);
      });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles")
      .update({ display_name: displayName, custom_system_prompt: customSystemPrompt } as any)
      .eq("user_id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
    setSaving(false);
  };

  const handleSavePreferences = () => {
    setTheme(localTheme);
    savePreferences({ costMode: localCostMode, defaultLayout: localLayout, theme: localTheme });
    toast.success("Preferences saved");
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
    { value: "system" as const, label: "System", icon: Monitor },
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold">General</h3>
              <p className="text-sm text-muted-foreground">Manage the look and feel of the platform</p>
            </div>
            <div className="space-y-2">
              <Label>Appearance</Label>
              <div className="inline-flex h-[52px] w-full items-center justify-between rounded-full bg-muted/50 p-1 border border-border/30">
                {themeOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setLocalTheme(value)}
                    className={cn(
                      "relative inline-flex h-full w-full items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                      localTheme === value ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {localTheme === value && (
                      <div className="absolute inset-0 rounded-full shadow-sm bg-background border border-border/40" />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className="h-[18px] w-[18px]" /> {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="sticky bottom-0 pt-4 border-t border-border/30">
              <Button onClick={handleSavePreferences} className="w-full rounded-full">Save</Button>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold">AI Preferences</h3>
              <p className="text-sm text-muted-foreground">Configure AI behavior and response settings</p>
            </div>
            <div className="space-y-3">
              <Label>Cost Mode</Label>
              <RadioGroup value={localCostMode} onValueChange={(v) => setLocalCostMode(v as CostMode)} className="flex flex-col gap-3">
                {(Object.entries(AI_CONFIG.costModes) as [CostMode, typeof AI_CONFIG.costModes.balanced][]).map(([key, mode]) => (
                  <div key={key} className="flex items-center gap-2">
                    <RadioGroupItem value={key} id={`dlg-mode-${key}`} />
                    <Label htmlFor={`dlg-mode-${key}`} className="cursor-pointer text-sm">{mode.label}</Label>
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
            <div className="sticky bottom-0 pt-4 border-t border-border/30">
              <Button onClick={handleSavePreferences} className="w-full rounded-full">Save</Button>
            </div>
          </div>
        );

      case "memory":
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">AI Memory</h3>
              <p className="text-sm text-muted-foreground">The AI learns key facts about you from conversations</p>
            </div>
            <MemoryManager />
          </div>
        );

      case "subscription":
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold">Subscription</h3>
              <p className="text-sm text-muted-foreground">Manage your subscription and billing</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PlanBadge plan={plan} />
                <span className="text-sm text-muted-foreground capitalize">{plan} Plan</span>
              </div>
              {plan === "free" ? (
                <Button size="sm" onClick={() => { navigate("/pricing"); onOpenChange?.(false); }} className="gap-1.5 shadow-glow-sm">
                  <Crown className="h-3.5 w-3.5" /> Upgrade
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => { navigate("/pricing"); onOpenChange?.(false); }}>
                  Manage Plan
                </Button>
              )}
            </div>
            <div className="space-y-4 pt-4 border-t border-border/30">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Usage This Month
              </h4>
              <div className="flex items-center justify-between gap-2">
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
            <div className="space-y-4 pt-4 border-t border-border/30">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Active Sessions
              </h4>
              <p className="text-sm text-muted-foreground">Manage your active sessions across devices</p>
              <SessionManager />
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold">Profile</h3>
              <p className="text-sm text-muted-foreground">Update your personal information</p>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            {features?.custom_system_prompt && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" /> Custom System Prompt
                </Label>
                <Textarea value={customSystemPrompt} onChange={(e) => setCustomSystemPrompt(e.target.value)}
                  placeholder="Set a custom AI personality or instructions..." rows={3} />
                <p className="text-xs text-muted-foreground">This prompt is prepended to every AI request.</p>
              </div>
            )}
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full rounded-full gap-1.5">
              <Save className="h-3.5 w-3.5" /> Save Profile
            </Button>
            <div className="space-y-3 pt-4 border-t border-border/30">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-primary" /> Onboarding
              </h4>
              <p className="text-sm text-muted-foreground">Re-run the onboarding tour to learn about features</p>
              <Button variant="outline" onClick={handleRestartTour} className="w-full rounded-full gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Restart Tour
              </Button>
            </div>
            <div className="pt-4 border-t border-border/30">
              <Button variant="outline" onClick={() => { signOut(); onOpenChange?.(false); }} className="w-full rounded-full">
                Logout
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl h-[80vh] max-h-[700px] p-0 gap-0 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="h-full border-r border-border/30 w-[260px] shrink-0 hidden md:flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b border-border/30">
              <h2 className="text-lg font-bold font-['Space_Grotesk']">Settings</h2>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 text-sm font-medium rounded-xl transition-all text-left",
                      isActive
                        ? "bg-muted/80 text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile tabs */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="md:hidden flex gap-1 p-3 border-b border-border/30 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all shrink-0",
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 md:p-6">{renderContent()}</div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
