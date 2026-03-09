import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CostMode } from "@/lib/aiConfig";
import { toast } from "sonner";

interface Preferences {
  costMode: CostMode;
  defaultModels: string[] | null;
  defaultLayout: "grid" | "stacked";
  theme: "light" | "dark" | "system";
  onboardingCompleted: boolean;
}

interface UsePreferencesReturn extends Preferences {
  loading: boolean;
  savePreferences: (prefs: Partial<Preferences>) => Promise<void>;
  setLayout: (layout: "grid" | "stacked") => void;
}

export function usePreferences(): UsePreferencesReturn {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Preferences>({
    costMode: "balanced",
    defaultModels: null,
    defaultLayout: "grid",
    theme: "dark",
    onboardingCompleted: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPrefs({
            costMode: (data.cost_mode as CostMode) || "balanced",
            defaultModels: data.default_models,
            defaultLayout: (data.default_layout as "grid" | "stacked") || "grid",
            theme: ((data as any).theme as "light" | "dark" | "system") || "dark",
            onboardingCompleted: (data as any).onboarding_completed ?? false,
          });
        }
        setLoading(false);
      });
  }, [user]);

  const savePreferences = useCallback(async (updates: Partial<Preferences>) => {
    if (!user) return;
    const newPrefs = { ...prefs, ...updates };
    setPrefs(newPrefs);

    const row: any = {
      user_id: user.id,
      cost_mode: newPrefs.costMode,
      default_models: newPrefs.defaultModels,
      default_layout: newPrefs.defaultLayout,
      theme: newPrefs.theme,
      onboarding_completed: newPrefs.onboardingCompleted,
    };

    const { error } = await supabase
      .from("user_preferences")
      .upsert(row, { onConflict: "user_id" });

    if (error) toast.error("Failed to save preferences");
    else toast.success("Preferences saved");
  }, [user, prefs]);

  const setLayout = useCallback((layout: "grid" | "stacked") => {
    setPrefs(prev => ({ ...prev, defaultLayout: layout }));
    if (user) {
      supabase
        .from("user_preferences")
        .upsert({ user_id: user.id, default_layout: layout }, { onConflict: "user_id" })
        .then(({ error }) => { if (error) console.error("Failed to save layout preference", error); });
    }
  }, [user]);

  return { ...prefs, loading, savePreferences, setLayout };
}
