import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold font-['Space_Grotesk']">{title}</h2>
        <p className="text-muted-foreground max-w-md">{description}</p>
      </div>
      {action}
    </div>
  );
}
