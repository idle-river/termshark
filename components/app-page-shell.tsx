import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type AppPageShellProps = {
  title: string;
  children?: React.ReactNode;
};

export function AppPageShell({ title, children }: AppPageShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="p-6">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {children && <div className="mt-6">{children}</div>}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
