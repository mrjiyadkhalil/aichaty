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
  const [totalTokens, setTotalTokens] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [messagesUsedToday, setMessagesUsedToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Get monthly usage for cost and tokens
    const { data: monthlyData, error: monthlyError } = await supabase
      .from("usage_events")
      .select("estimated_cost, input_tokens, output_tokens")
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString());

    if (!monthlyError && monthlyData) {
      const cost = monthlyData.reduce((sum, row) => sum + (Number(row.estimated_cost) || 0), 0);
      const tokens = monthlyData.reduce((sum, row) => 
        sum + (Number(row.input_tokens) || 0) + (Number(row.output_tokens) || 0), 0
      );
      setTotalCost(cost);
      setTotalTokens(tokens);
      setRequestCount(monthlyData.length);
    }

    // Get today's message count for free tier tracking (count distinct message_ids)
    const { data: todayData, error: todayError } = await supabase
      .from("usage_events")
      .select("message_id")
      .eq("user_id", user.id)
      .not("message_id", "is", null)
      .gte("created_at", startOfDay.toISOString());

    if (!todayError && todayData) {
      const uniqueMessages = new Set(todayData.map(r => r.message_id));
      setMessagesUsedToday(uniqueMessages.size);
    }
    
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    totalCost,
    totalTokens,
    requestCount,
    messagesUsedToday,
    isNearCap: totalCost >= AI_CONFIG.limits.softCapUsd,
    isAtCap: totalCost >= AI_CONFIG.limits.hardCapUsd,
    loading,
    refresh: fetchUsage,
  };
}
