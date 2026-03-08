import { ReactNode } from "react";

interface ResponseGridProps {
  children: ReactNode;
  layout: "grid" | "stacked";
}

export function ResponseGrid({ children, layout }: ResponseGridProps) {
  return (
    <div className={layout === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "space-y-3"}>
      {children}
    </div>
  );
}
