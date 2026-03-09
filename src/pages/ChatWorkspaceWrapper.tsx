import ChatWorkspace from "./ChatWorkspace";
import { AppLayout } from "@/components/AppLayout";
import { usePreferences } from "@/hooks/usePreferences";
import { useState, useEffect } from "react";

export default function ChatWorkspaceWrapper() {
  const { defaultLayout, setLayout: setPreferredLayout } = usePreferences();
  const [layout, setLayout] = useState<"grid" | "stacked">(defaultLayout);

  useEffect(() => {
    setLayout(defaultLayout);
  }, [defaultLayout]);

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
