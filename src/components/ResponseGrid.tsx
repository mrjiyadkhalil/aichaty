import { ReactNode } from "react";

interface ResponseGridProps {
  children: ReactNode;
  layout: "grid" | "stacked";
}

export function ResponseGrid({ children, layout }: ResponseGridProps) {
  return (
    <div className={layout === "grid" 
      ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr" 
      : "space-y-4"}>
      {children}
    </div>
  );
}
