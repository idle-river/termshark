import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type AppPageShellProps = {
  children?: React.ReactNode;
};

export function AppPageShell({ children }: AppPageShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="p-6">
          {children && <div className="mt-6">{children}</div>}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
