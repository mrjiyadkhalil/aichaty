import ChatWorkspace from "./ChatWorkspace";
import { AppLayout } from "@/components/AppLayout";
import { usePreferences } from "@/hooks/usePreferences";
import { useUsage } from "@/hooks/useUsage";
import { useSubscription } from "@/hooks/useSubscription";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

export default function ChatWorkspaceWrapper() {
  const { defaultLayout, setLayout: setPreferredLayout } = usePreferences();
  const [layout, setLayout] = useState<"grid" | "stacked">(defaultLayout);
  const { messagesUsedToday } = useUsage();
  const { plan, features } = useSubscription();

  useEffect(() => {
    setLayout(defaultLayout);
  }, [defaultLayout]);

  // Warning notification for free users approaching message limit
  useEffect(() => {
    if (plan !== "free") return;

    const messagesPerDay = features?.messages_per_day ?? 10;
    const messagesLeft = Math.max(0, messagesPerDay - messagesUsedToday);

    // Show warning when 2-3 messages left
    if (messagesLeft === 3 || messagesLeft === 2) {
      const warningKey = `message-warning-${messagesUsedToday}`;
      const alreadyShown = sessionStorage.getItem(warningKey);

      if (!alreadyShown) {
        toast.warning(
          `Only ${messagesLeft} message${messagesLeft > 1 ? 's' : ''} left today`,
          {
            description: "Upgrade to Pro for unlimited messages",
            icon: <AlertTriangle className="h-4 w-4" />,
            duration: 5000,
          }
        );
        sessionStorage.setItem(warningKey, "true");
      }
    }
  }, [messagesUsedToday, plan, features]);

  const handleToggleLayout = () => {
    const newLayout = layout === "grid" ? "stacked" : "grid";
    setLayout(newLayout);
    setPreferredLayout(newLayout);
  };

  return (
    <AppLayout layout={layout} onToggleLayout={handleToggleLayout}>
      <ChatWorkspace layout={layout} onToggleLayout={handleToggleLayout} />
    </AppLayout>
  );
}
