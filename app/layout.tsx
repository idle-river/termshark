import "./globals.css";
import { Figtree } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/react-query";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <QueryProvider>
        <Toaster />
        <TooltipProvider>{children}</TooltipProvider>
      </QueryProvider>
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", figtree.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
