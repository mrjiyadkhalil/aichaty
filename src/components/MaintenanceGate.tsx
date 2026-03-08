import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const [maintenance, setMaintenance] = useState<{ enabled: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("system_config")
      .select("value_json")
      .eq("key", "maintenance_mode")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value_json) {
          const config = data.value_json as any;
          if (config.enabled) {
            // Check scheduled times
            const now = new Date();
            const start = config.start_at ? new Date(config.start_at) : null;
            const end = config.end_at ? new Date(config.end_at) : null;
            if (start && now < start) { setMaintenance(null); }
            else if (end && now > end) { setMaintenance(null); }
            else { setMaintenance({ enabled: true, message: config.message || "We're currently performing maintenance. Please check back soon." }); }
          }
        }
        setLoading(false);
      });
  }, []);

  if (loading) return null;
  if (maintenance?.enabled && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md p-8">
          <Wrench className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold font-['Space_Grotesk']">Under Maintenance</h1>
          <p className="text-muted-foreground">{maintenance.message}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
