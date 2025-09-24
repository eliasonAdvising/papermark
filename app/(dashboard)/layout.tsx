'use client';

import { TeamProvider } from "@/context/team-context";
import { SessionProvider } from "next-auth/react";

import { PostHogCustomProvider } from "@/components/providers/posthog-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <PostHogCustomProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Toaster closeButton />
          <TooltipProvider delayDuration={100}>
            <TeamProvider>{children}</TeamProvider>
          </TooltipProvider>
        </ThemeProvider>
      </PostHogCustomProvider>
    </SessionProvider>
  );
}
