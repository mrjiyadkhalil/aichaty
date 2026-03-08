import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

interface AppShellProps {
  sidebar: ReactNode;
  topBar: ReactNode;
  children: ReactNode;
  bottomBar?: ReactNode;
}

export function AppShell({ sidebar, topBar, children, bottomBar }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {sidebar}
        <div className="flex-1 flex flex-col min-w-0">
          {topBar}
          <main className="flex-1 overflow-y-auto">{children}</main>
          {bottomBar}
        </div>
      </div>
    </SidebarProvider>
  );
}
