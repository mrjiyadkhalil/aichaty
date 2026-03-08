import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAdminCheck() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setIsAdmin(false); setLoading(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => { setIsAdmin(!!data); setLoading(false); });
  }, [user, authLoading]);

  return { isAdmin, loading: authLoading || loading };
}

export async function adminApi(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("admin-api", {
    body: { action, ...params },
  });
  if (error) throw error;
  return data;
}
