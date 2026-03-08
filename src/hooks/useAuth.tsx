import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  banned: boolean;
  suspended: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  banned: false,
  suspended: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [banned, setBanned] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const sessionRegistered = useRef(false);

  const checkBanStatus = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("status, suspended_until")
      .eq("user_id", userId)
      .single();
    if (data) {
      if (data.status === "banned") {
        setBanned(true);
        setSuspended(false);
        return;
      }
      if (data.status === "suspended") {
        const until = data.suspended_until ? new Date(data.suspended_until) : null;
        if (until && until > new Date()) {
          setSuspended(true);
          setBanned(false);
          return;
        }
        // Suspension expired, status should be reactivated but we treat as active
        setSuspended(false);
      }
      setBanned(false);
    }
  };

  const registerSession = async (userId: string) => {
    if (sessionRegistered.current) return;
    sessionRegistered.current = true;
    const ua = navigator.userAgent;
    let browser = "Unknown", os = "Unknown", device = "Desktop";
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg/")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac OS")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) { os = "Android"; device = "Mobile"; }
    else if (ua.includes("iPhone")) { os = "iOS"; device = "Mobile"; }
    
    await supabase.from("user_sessions").update({ is_current: false } as any).eq("user_id", userId);
    await supabase.from("user_sessions").insert({ user_id: userId, browser, os, device_name: device, is_current: true } as any);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          checkBanStatus(session.user.id);
          registerSession(session.user.id);
        } else {
          setBanned(false);
          setSuspended(false);
          sessionRegistered.current = false;
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkBanStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, banned, suspended, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
