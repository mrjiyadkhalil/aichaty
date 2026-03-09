import { useSidebar } from "@/components/ui/sidebar";
import { useSwipeSidebar } from "@/hooks/useSwipeSidebar";

export function SwipeHandler() {
  const { setOpenMobile, openMobile } = useSidebar();

  useSwipeSidebar(
    () => setOpenMobile(true),
    () => setOpenMobile(false),
    openMobile
  );

  return null;
}
