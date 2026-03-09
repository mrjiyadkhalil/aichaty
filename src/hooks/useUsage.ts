import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AI_CONFIG } from "@/lib/aiConfig";

interface UsageData {
  totalCost: number;
  totalTokens: number;
  requestCount: number;
  messagesUsedToday: number;
  isNearCap: boolean;
  isAtCap: boolean;
  loading: boolean;
  refresh: () => void;
}

export function useUsage(): UsageData {
  const { user } = useAuth();
  const [totalCost, setTotalCost] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("usage_events")
      .select("estimated_cost")
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString());

    if (!error && data) {
      const cost = data.reduce((sum, row) => sum + (Number(row.estimated_cost) || 0), 0);
      setTotalCost(cost);
      setRequestCount(data.length);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    totalCost,
    requestCount,
    isNearCap: totalCost >= AI_CONFIG.limits.softCapUsd,
    isAtCap: totalCost >= AI_CONFIG.limits.hardCapUsd,
    loading,
    refresh: fetchUsage,
  };
}
