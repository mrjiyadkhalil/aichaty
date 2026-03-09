import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { PlanFeatures } from "@/hooks/useSubscription";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Plan {
  id: string;
  plan_name: string;
  price_monthly: number;
  price_yearly: number;
  features: PlanFeatures;
}

export default function AdminSubscriptionPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState({
    plan_name: "",
    price_monthly: 0,
    price_yearly: 0,
  });

  const loadPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("subscription_plans").select("*").order("plan_name");
      if (error) throw error;
      setPlans((data || []).map(p => ({
        id: p.id,
        plan_name: p.plan_name,
        price_monthly: Number(p.price_monthly),
        price_yearly: Number(p.price_yearly),
        features: p.features as unknown as PlanFeatures,
      })));
    } catch (err) {
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlans(); }, []);

  const handleSave = async (plan: Plan) => {
    setSaving(plan.id);
    try {
      const { error } = await supabase
        .from("subscription_plans")
        .update({
          price_monthly: plan.price_monthly,
          price_yearly: plan.price_yearly,
          features: plan.features as any,
        })
        .eq("id", plan.id);

      if (error) throw error;
      toast.success(`${plan.plan_name} plan updated successfully`);
    } catch (err) {
      toast.error("Failed to update plan");
    } finally {
      setSaving(null);
    }
  };

  const updatePlanField = (planId: string, field: keyof Plan, value: any) => {
    setPlans(plans.map(p => p.id === planId ? { ...p, [field]: value } : p));
  };

  const updateFeature = (planId: string, feature: keyof PlanFeatures, value: any) => {
    setPlans(plans.map(p => 
      p.id === planId 
        ? { ...p, features: { ...p.features, [feature]: value } }
        : p
    ));
  };

  const handleAddPlan = async () => {
    if (!newPlan.plan_name.trim()) {
      toast.error("Plan name is required");
      return;
    }

    setSaving("new");
    try {
      const defaultFeatures: PlanFeatures = {
        messages_per_day: 20,
        max_output_tokens: 4096,
        models: ["google/gemini-2.5-flash"],
        file_uploads: true,
        projects: true,
        multi_chat: true,
        synthesis: true,
        prompt_library: true,
        bookmarks: true,
        export: true,
        custom_system_prompt: false,
        usage_cap_soft: 10,
        usage_cap_hard: 20,
      };

      const { error } = await supabase.from("subscription_plans").insert({
        plan_name: newPlan.plan_name.toLowerCase(),
        price_monthly: newPlan.price_monthly,
        price_yearly: newPlan.price_yearly,
        features: defaultFeatures as any,
      });

      if (error) throw error;
      
      toast.success("Plan created successfully");
      setShowAddDialog(false);
      setNewPlan({ plan_name: "", price_monthly: 0, price_yearly: 0 });
      await loadPlans();
    } catch (err) {
      toast.error("Failed to create plan");
    } finally {
      setSaving(null);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    setSaving(planId);
    try {
      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;
      
      toast.success("Plan deleted successfully");
      setShowDeleteDialog(null);
      await loadPlans();
    } catch (err) {
      toast.error("Failed to delete plan");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk']">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage pricing and features for each plan</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Plan
        </Button>
      </div>

      <div className="grid gap-6">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="capitalize">{plan.plan_name} Plan</span>
                <Button
                  onClick={() => handleSave(plan)}
                  disabled={saving === plan.id}
                  size="sm"
                >
                  {saving === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Price ($)</Label>
                  <Input
                    type="number"
                    value={plan.price_monthly}
                    onChange={(e) => updatePlanField(plan.id, "price_monthly", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yearly Price ($)</Label>
                  <Input
                    type="number"
                    value={plan.price_yearly}
                    onChange={(e) => updatePlanField(plan.id, "price_yearly", Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-sm">Features</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Messages Per Day</Label>
                    <Input
                      type="number"
                      value={plan.features.messages_per_day}
                      onChange={(e) => updateFeature(plan.id, "messages_per_day", Number(e.target.value))}
                      placeholder="-1 for unlimited"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Output Tokens</Label>
                    <Input
                      type="number"
                      value={plan.features.max_output_tokens}
                      onChange={(e) => updateFeature(plan.id, "max_output_tokens", Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Tokens Per Month</Label>
                    <Input
                      type="number"
                      value={plan.features.max_tokens_per_month || ""}
                      onChange={(e) => updateFeature(plan.id, "max_tokens_per_month", Number(e.target.value) || undefined)}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>File Max MB</Label>
                    <Input
                      type="number"
                      value={plan.features.file_max_mb || ""}
                      onChange={(e) => updateFeature(plan.id, "file_max_mb", Number(e.target.value) || undefined)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Usage Cap Soft</Label>
                    <Input
                      type="number"
                      value={plan.features.usage_cap_soft}
                      onChange={(e) => updateFeature(plan.id, "usage_cap_soft", Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Usage Cap Hard</Label>
                    <Input
                      type="number"
                      value={plan.features.usage_cap_hard}
                      onChange={(e) => updateFeature(plan.id, "usage_cap_hard", Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Boolean Features */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label>File Uploads</Label>
                    <Switch
                      checked={plan.features.file_uploads}
                      onCheckedChange={(v) => updateFeature(plan.id, "file_uploads", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Projects</Label>
                    <Switch
                      checked={plan.features.projects}
                      onCheckedChange={(v) => updateFeature(plan.id, "projects", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Multi Chat</Label>
                    <Switch
                      checked={plan.features.multi_chat}
                      onCheckedChange={(v) => updateFeature(plan.id, "multi_chat", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Synthesis</Label>
                    <Switch
                      checked={plan.features.synthesis}
                      onCheckedChange={(v) => updateFeature(plan.id, "synthesis", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Prompt Library</Label>
                    <Switch
                      checked={plan.features.prompt_library}
                      onCheckedChange={(v) => updateFeature(plan.id, "prompt_library", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Bookmarks</Label>
                    <Switch
                      checked={plan.features.bookmarks}
                      onCheckedChange={(v) => updateFeature(plan.id, "bookmarks", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Export</Label>
                    <Switch
                      checked={plan.features.export}
                      onCheckedChange={(v) => updateFeature(plan.id, "export", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Custom System Prompt</Label>
                    <Switch
                      checked={plan.features.custom_system_prompt}
                      onCheckedChange={(v) => updateFeature(plan.id, "custom_system_prompt", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Priority Speed</Label>
                    <Switch
                      checked={plan.features.priority_speed || false}
                      onCheckedChange={(v) => updateFeature(plan.id, "priority_speed", v)}
                    />
                  </div>
                </div>

                {/* Models */}
                <div className="space-y-2 pt-4 border-t">
                  <Label>Allowed Models</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Type "all" for all models, or comma-separated model IDs
                  </p>
                  <Input
                    value={
                      plan.features.models === "all"
                        ? "all"
                        : Array.isArray(plan.features.models)
                        ? plan.features.models.join(", ")
                        : ""
                    }
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      updateFeature(
                        plan.id,
                        "models",
                        val === "all" ? "all" : val.split(",").map(m => m.trim()).filter(Boolean)
                      );
                    }}
                    placeholder="e.g., google/gemini-2.5-flash, openai/gpt-5-nano"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
