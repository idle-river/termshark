import { AppSidebar } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type AppPageShellProps = {
  children?: React.ReactNode;
  title?: string;
  mainClassName?: string;
  contentClassName?: string;
  insetClassName?: string;
  headerClassName?: string;
  headerContent?: React.ReactNode;
};

export function AppPageShell({
  children,
  mainClassName,
  contentClassName,
  insetClassName,
  headerClassName,
  headerContent,
}: AppPageShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className={insetClassName}>
        <header
          className={cn(
            "flex h-16 shrink-0 items-center gap-2 border-b px-4",
            headerClassName,
          )}
        >
          <SidebarTrigger className="-ml-1" />
          {headerContent && (
            <div className="min-w-0 flex-1">{headerContent}</div>
          )}
        </header>
        <main className={mainClassName ?? "p-6"}>
          {children && (
            <div className={contentClassName ?? "mt-6"}>{children}</div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
