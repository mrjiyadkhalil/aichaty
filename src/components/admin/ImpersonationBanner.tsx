import { useImpersonation } from "@/hooks/useImpersonation";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedUserName, stopImpersonation } = useImpersonation();

  if (!isImpersonating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-yellow-950 px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium shadow-lg">
      <Eye className="h-4 w-4" />
      <span>Impersonating: <strong>{impersonatedUserName || "User"}</strong> — You are viewing the app as this user</span>
      <Button
        size="sm"
        variant="outline"
        onClick={stopImpersonation}
        className="ml-2 h-7 bg-yellow-600/20 border-yellow-700/30 text-yellow-950 hover:bg-yellow-600/40 gap-1"
      >
        <X className="h-3 w-3" /> Exit
      </Button>
    </div>
  );
}
