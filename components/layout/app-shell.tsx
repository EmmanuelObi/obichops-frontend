"use client";

import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { WorkspaceSwitcher } from "@/components/platform/workspace-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useEffectiveWorkspace } from "@/hooks/use-effective-workspace";
import type { Role } from "@/types/auth";

interface AppShellProps {
  children: ReactNode;
  role?: Role;
  email?: string | null;
  name?: string | null;
}

export function AppShell({ children, role, email, name }: AppShellProps) {
  const { displayName, hasWorkspace, isManagingWorkspace } = useEffectiveWorkspace();

  return (
    <SidebarProvider>
      <NavigationProgress />
      <AppSidebar role={role} />
      <SidebarInset className="premium-surface">
        {isManagingWorkspace ? (
          <div className="border-b border-primary/15 bg-primary/5 px-4 py-2 text-sm text-muted-foreground">
            Managing <span className="font-medium text-foreground">{displayName}</span>{" "}
            as platform admin. Changes apply to this workspace.
          </div>
        ) : null}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/85 px-4 backdrop-blur-xl lg:h-16">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {hasWorkspace && !isManagingWorkspace ? (
              <p className="truncate text-sm font-medium sm:text-base">
                {displayName}
              </p>
            ) : null}
            <WorkspaceSwitcher />
          </div>
          <UserMenu email={email} name={name} role={role} />
        </header>
        <div className="flex flex-1 flex-col animate-fade-in">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
