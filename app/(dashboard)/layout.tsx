'use client';

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { TeamProvider } from "@/context/team-context";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider delayDuration={100}>
          <TeamProvider>
            <Toaster closeButton />
            {children}
          </TeamProvider>
        </TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}