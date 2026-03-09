import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdmin";

export type PlanName = "free" | "pro";

export interface PlanFeatures {
  messages_per_day: number;
  max_output_tokens: number;
  models: string[] | "all";
  file_uploads: boolean;
  file_max_mb?: number;
  projects: boolean;
  multi_chat: boolean;
  synthesis: boolean;
  prompt_library: boolean;
  bookmarks: boolean;
  export: boolean;
  custom_system_prompt: boolean;
  priority_speed?: boolean;
  admin_dashboard?: boolean;
  usage_cap_soft: number;
  usage_cap_hard: number;
}

export interface SubscriptionPlan {
  id: string;
  plan_name: PlanName;
  price_monthly: number;
  price_yearly: number;
  features: PlanFeatures;
}

interface UseSubscriptionReturn {
  plan: PlanName;
  features: PlanFeatures | null;
  plans: SubscriptionPlan[];
  loading: boolean;
  canAccess: (feature: keyof PlanFeatures) => boolean;
  isModelAllowed: (model: string) => boolean;
  refresh: () => void;
}

const DEFAULT_FREE_FEATURES: PlanFeatures = {
  messages_per_day: 20,
  max_output_tokens: 2048,
  models: ["google/gemini-2.5-flash", "openai/gpt-5-nano"],
  file_uploads: false,
  projects: false,
  multi_chat: false,
  synthesis: false,
  prompt_library: false,
  bookmarks: false,
  export: false,
  custom_system_prompt: false,
  usage_cap_soft: 5,
  usage_cap_hard: 10,
};

const ADMIN_FEATURES: PlanFeatures = {
  messages_per_day: 999999,
  max_output_tokens: 8192,
  models: "all",
  file_uploads: true,
  file_max_mb: 50,
  projects: true,
  multi_chat: true,
  synthesis: true,
  prompt_library: true,
  bookmarks: true,
  export: true,
  custom_system_prompt: true,
  priority_speed: true,
  admin_dashboard: true,
  usage_cap_soft: 999,
  usage_cap_hard: 999,
};

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [plan, setPlan] = useState<PlanName>("free");
  const [features, setFeatures] = useState<PlanFeatures | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || adminLoading) { if (!user) setLoading(false); return; }
    setLoading(true);

    if (isAdmin) {
      setPlan("pro");
      setFeatures(ADMIN_FEATURES);
      setLoading(false);
      const { data } = await supabase.from("subscription_plans").select("*");
      setPlans((data || []).map((p: any) => ({
        id: p.id,
        plan_name: p.plan_name as PlanName,
        price_monthly: Number(p.price_monthly),
        price_yearly: Number(p.price_yearly),
        features: p.features as PlanFeatures,
      })));
      return;
    }

    const [profileRes, plansRes] = await Promise.all([
      supabase.from("profiles").select("plan").eq("user_id", user.id).single(),
      supabase.from("subscription_plans").select("*"),
    ]);

    const userPlan = ((profileRes.data as any)?.plan as PlanName) || "free";
    setPlan(userPlan);

    const allPlans = (plansRes.data || []).map((p: any) => ({
      id: p.id,
      plan_name: p.plan_name as PlanName,
      price_monthly: Number(p.price_monthly),
      price_yearly: Number(p.price_yearly),
      features: p.features as PlanFeatures,
    }));
    setPlans(allPlans);

    const currentPlan = allPlans.find((p) => p.plan_name === userPlan);
    setFeatures(currentPlan?.features || DEFAULT_FREE_FEATURES);
    setLoading(false);
  }, [user, isAdmin, adminLoading]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const canAccess = useCallback((feature: keyof PlanFeatures): boolean => {
    if (isAdmin) return true;
    if (!features) return false;
    const val = features[feature];
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val !== 0;
    return true;
  }, [features, isAdmin]);

  const isModelAllowed = useCallback((model: string): boolean => {
    if (isAdmin) return true;
    if (!features) return false;
    if (features.models === "all") return true;
    return (features.models as string[]).includes(model);
  }, [features, isAdmin]);

  return { plan, features, plans, loading: loading || adminLoading, canAccess, isModelAllowed, refresh: fetchData };
}
