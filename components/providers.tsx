"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider>
        {children}
        <Toaster richColors closeButton position="top-right" theme="light" />
      </TooltipProvider>
    </SessionProvider>
  );
}
