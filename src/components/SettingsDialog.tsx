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
  Save,
  User,
  BarChart3,
  Settings,
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  Brain,
  MessageSquare,
  Crown,
  ShieldCheck,
  ToggleRight,
} from "lucide-react";
import { AI_CONFIG, CostMode } from "@/lib/aiConfig";
import { MemoryManager } from "@/components/MemoryManager";
import { Textarea } from "@/components/ui/textarea";
import { PlanBadge } from "@/components/PlanBadge";
import { SessionManager } from "@/components/SessionManager";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsDialog({ trigger, open, onOpenChange }: SettingsDialogProps) {
  const { user, signOut } = useAuth();
  const { totalCost, requestCount, isNearCap, isAtCap } = useUsage();
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
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    setLocalCostMode(costMode);
  }, [costMode]);
  useEffect(() => {
    setLocalLayout(defaultLayout);
  }, [defaultLayout]);
  useEffect(() => {
    setLocalTheme(prefTheme);
  }, [prefTheme]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, custom_system_prompt")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
        if ((data as any)?.custom_system_prompt) setCustomSystemPrompt((data as any).custom_system_prompt);
      });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="h-full border-r border-border/30 w-[260px] shrink-0 hidden md:block">
            <div className="flex items-center justify-start gap-3 border-b border-border/30 p-4">
              <h2 className="text-lg font-bold font-['Space_Grotesk']">Settings</h2>
            </div>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              orientation="vertical"
              className="w-full"
            >
              <TabsList className="w-full h-auto flex-col gap-1 bg-transparent p-4 border-none rounded-none">
                <TabsTrigger
                  value="general"
                  className={cn(
                    "w-full justify-start p-3 text-sm font-medium rounded-xl data-[state=active]:bg-surface data-[state=active]:shadow-sm",
                    "relative overflow-hidden"
                  )}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Settings className="h-[18px] w-[18px]" />
                    General
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="preferences"
                  className="w-full justify-start p-3 text-sm font-medium rounded-xl data-[state=active]:bg-surface data-[state=active]:shadow-sm"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <ToggleRight className="h-[18px] w-[18px]" />
                    AI Preferences
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="memory"
                  className="w-full justify-start p-3 text-sm font-medium rounded-xl data-[state=active]:bg-surface data-[state=active]:shadow-sm"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Brain className="h-[18px] w-[18px]" />
                    Memory
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="subscription"
                  className="w-full justify-start p-3 text-sm font-medium rounded-xl data-[state=active]:bg-surface data-[state=active]:shadow-sm"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Crown className="h-[18px] w-[18px]" />
                    Subscription
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="profile"
                  className="w-full justify-start p-3 text-sm font-medium rounded-xl data-[state=active]:bg-surface data-[state=active]:shadow-sm"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <User className="h-[18px] w-[18px]" />
                    Profile
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* Content */}
              <div className="flex-1 overflow-y-auto max-h-[calc(90vh-80px)]">
                <TabsContent value="general" className="mt-0 p-4 space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold">General</h3>
                    <p className="text-sm text-muted-foreground">Manage the look and feel of the platform</p>
                  </div>

                  {/* Theme */}
                  <div className="space-y-2">
                    <Label htmlFor="appearance">Appearance</Label>
                    <div className="inline-flex h-[52px] w-full items-center justify-between rounded-full bg-surface p-1 border border-border/30">
                      {themeOptions.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setLocalTheme(value)}
                          className={cn(
                            "relative inline-flex h-full w-full items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                            localTheme === value && "text-foreground"
                          )}
                        >
                          {localTheme === value && (
                            <div className="absolute inset-0 rounded-full shadow-sm bg-background" />
                          )}
                          <span className="relative z-10 flex items-center gap-2">
                            <Icon className="h-[18px] w-[18px]" />
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleSavePreferences} className="w-full rounded-full">
                    Save
                  </Button>
                </TabsContent>

                <TabsContent value="preferences" className="mt-0 p-4 space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold">AI Preferences</h3>
                    <p className="text-sm text-muted-foreground">Configure AI behavior and response settings</p>
                  </div>

                  {/* Cost Mode */}
                  <div className="space-y-3">
                    <Label>Cost Mode</Label>
                    <RadioGroup
                      value={localCostMode}
                      onValueChange={(v) => setLocalCostMode(v as CostMode)}
                      className="flex flex-col gap-3"
                    >
                      {(Object.entries(AI_CONFIG.costModes) as [CostMode, typeof AI_CONFIG.costModes.balanced][]).map(
                        ([key, mode]) => (
                          <div key={key} className="flex items-center gap-2">
                            <RadioGroupItem value={key} id={`mode-${key}`} />
                            <Label htmlFor={`mode-${key}`} className="cursor-pointer text-sm">
                              {mode.label}
                            </Label>
                          </div>
                        )
                      )}
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
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          checked={localLayout === "grid"}
                          onChange={() => setLocalLayout("grid")}
                          className="accent-primary"
                        />{" "}
                        Grid
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          checked={localLayout === "stacked"}
                          onChange={() => setLocalLayout("stacked")}
                          className="accent-primary"
                        />{" "}
                        Stacked
                      </label>
                    </div>
                  </div>

                  <Button onClick={handleSavePreferences} className="w-full rounded-full">
                    Save
                  </Button>
                </TabsContent>

                <TabsContent value="memory" className="mt-0 p-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">AI Memory</h3>
                    <p className="text-sm text-muted-foreground">The AI learns key facts about you from conversations</p>
                  </div>
                  <MemoryManager />
                </TabsContent>

                <TabsContent value="subscription" className="mt-0 p-4 space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold">Subscription</h3>
                    <p className="text-sm text-muted-foreground">Manage your subscription and billing</p>
                  </div>

                  {/* Plan */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <PlanBadge plan={plan} />
                        <span className="text-sm text-muted-foreground capitalize">{plan} Plan</span>
                      </div>
                      {plan === "free" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            navigate("/pricing");
                            onOpenChange?.(false);
                          }}
                          className="gap-1.5 shadow-glow-sm"
                        >
                          <Crown className="h-3.5 w-3.5" /> Upgrade
                        </Button>
                      )}
                      {plan !== "free" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigate("/pricing");
                            onOpenChange?.(false);
                          }}
                        >
                          Manage Plan
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Usage */}
                  <div className="space-y-4 pt-4 border-t">
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

                  {/* Sessions */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" /> Active Sessions
                    </h4>
                    <p className="text-sm text-muted-foreground">Manage your active sessions across devices</p>
                    <SessionManager />
                  </div>
                </TabsContent>

                <TabsContent value="profile" className="mt-0 p-4 space-y-5">
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
                      <Textarea
                        value={customSystemPrompt}
                        onChange={(e) => setCustomSystemPrompt(e.target.value)}
                        placeholder="Set a custom AI personality or instructions..."
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">This prompt is prepended to every AI request.</p>
                    </div>
                  )}
                  <Button onClick={handleSaveProfile} disabled={saving} className="w-full rounded-full gap-1.5">
                    <Save className="h-3.5 w-3.5" /> Save Profile
                  </Button>

                  {/* Onboarding */}
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-primary" /> Onboarding
                    </h4>
                    <p className="text-sm text-muted-foreground">Re-run the onboarding tour to learn about features</p>
                    <Button variant="outline" onClick={handleRestartTour} className="w-full rounded-full gap-1.5">
                      <RotateCcw className="h-3.5 w-3.5" /> Restart Tour
                    </Button>
                  </div>

                  {/* Logout */}
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        signOut();
                        onOpenChange?.(false);
                      }}
                      className="w-full rounded-full"
                    >
                      Logout
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
