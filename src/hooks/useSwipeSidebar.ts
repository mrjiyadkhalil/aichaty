import { useEffect, useRef, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SwipeConfig {
  threshold?: number;
  edgeWidth?: number;
}

export function useSwipeSidebar(
  onOpen: () => void,
  onClose: () => void,
  isOpen: boolean,
  config: SwipeConfig = {}
) {
  const { threshold = 60, edgeWidth = 30 } = config;
  const isMobile = useIsMobile();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const startedFromEdge = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY };
      // Only allow swipe-right-to-open from left edge
      startedFromEdge.current = touch.clientX <= edgeWidth;
    },
    [edgeWidth]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStart.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = Math.abs(touch.clientY - touchStart.current.y);

      // Ignore if vertical scroll is dominant
      if (dy > Math.abs(dx)) {
        touchStart.current = null;
        return;
      }

      if (dx > threshold && !isOpen && startedFromEdge.current) {
        onOpen();
      } else if (dx < -threshold && isOpen) {
        onClose();
      }

      touchStart.current = null;
    },
    [threshold, isOpen, onOpen, onClose]
  );

  useEffect(() => {
    if (!isMobile) return;

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchEnd]);
}
