import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UsageData {
  totalTokens: number;
  requestCount: number;
  messagesUsedToday: number;
  loading: boolean;
  refresh: () => void;
}

export function useUsage(): UsageData {
  const { user } = useAuth();
  const [totalTokens, setTotalTokens] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [messagesUsedToday, setMessagesUsedToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Get monthly usage for tokens
    const { data: monthlyData, error: monthlyError } = await supabase
      .from("usage_events")
      .select("input_tokens, output_tokens")
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString());

    if (!monthlyError && monthlyData) {
      const tokens = monthlyData.reduce((sum, row) => 
        sum + (Number(row.input_tokens) || 0) + (Number(row.output_tokens) || 0), 0
      );
      setTotalTokens(tokens);
      setRequestCount(monthlyData.length);
    }

    // Get today's message count (count distinct message_ids)
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
    // Auto-refresh every 15 seconds to keep token counts updated
    intervalRef.current = setInterval(fetchUsage, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchUsage]);

  return {
    totalTokens,
    requestCount,
    messagesUsedToday,
    loading,
    refresh: fetchUsage,
  };
}
