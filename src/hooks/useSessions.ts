import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface UserSession {
  id: string;
  device_name: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  location: string | null;
  last_active: string;
  created_at: string;
  is_current: boolean;
}

function parseUserAgent(ua: string) {
  let browser = "Unknown Browser";
  let os = "Unknown OS";
  let device = "Desktop";

  // Browser
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  // OS
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) { os = "Android"; device = "Mobile"; }
  else if (ua.includes("iPhone") || ua.includes("iPad")) { os = "iOS"; device = ua.includes("iPad") ? "Tablet" : "Mobile"; }

  return { browser, os, device_name: device };
}

export function useSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("last_active", { ascending: false });
    setSessions((data as any[]) || []);
    setLoading(false);
  }, [user]);

  const registerSession = useCallback(async () => {
    if (!user) return;
    const ua = navigator.userAgent;
    const { browser, os, device_name } = parseUserAgent(ua);
    
    // Mark all existing sessions as not current
    await supabase
      .from("user_sessions")
      .update({ is_current: false } as any)
      .eq("user_id", user.id);

    // Insert new session
    await supabase.from("user_sessions").insert({
      user_id: user.id,
      browser,
      os,
      device_name,
      is_current: true,
      last_active: new Date().toISOString(),
    } as any);
  }, [user]);

  const revokeSession = useCallback(async (sessionId: string) => {
    await supabase.from("user_sessions").delete().eq("id", sessionId);
    toast.success("Session revoked");
    fetchSessions();
  }, [fetchSessions]);

  const revokeAllOther = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("user_sessions")
      .delete()
      .eq("user_id", user.id)
      .eq("is_current", false);
    toast.success("All other sessions revoked");
    fetchSessions();
  }, [user, fetchSessions]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  return { sessions, loading, registerSession, revokeSession, revokeAllOther, refresh: fetchSessions };
}
