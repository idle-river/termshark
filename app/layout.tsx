import "./globals.css";
import { Figtree } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TooltipProvider>{children}</TooltipProvider>
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
