"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

import { UnauthorizedHandler } from "@/components/auth/unauthorized-handler";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <UnauthorizedHandler />
      <TooltipProvider>
        {children}
        <Toaster richColors closeButton position="top-right" theme="light" />
      </TooltipProvider>
    </SessionProvider>
  );
}
