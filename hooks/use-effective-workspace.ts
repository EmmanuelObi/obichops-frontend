"use client";

import { useSession } from "next-auth/react";

import { useWorkspaceBrand } from "@/hooks/use-workspace-brand";
import { usePlatformWorkspace } from "@/hooks/use-platform-workspace";

export function useEffectiveWorkspace() {
  const { data: session } = useSession();
  const { displayName, hasWorkspace, isPlatformUser } = useWorkspaceBrand();
  const { isManagingWorkspace, selection } = usePlatformWorkspace();

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const canUseAdmin =
    session?.user?.role === "ADMIN" ||
    (isSuperAdmin && (Boolean(session?.user?.workspaceId) || isManagingWorkspace));

  return {
    displayName: isManagingWorkspace && selection ? selection.name : displayName,
    hasWorkspace: hasWorkspace || isManagingWorkspace,
    isPlatformUser: isPlatformUser && !isManagingWorkspace,
    isManagingWorkspace,
    canUseAdmin,
    isSuperAdmin,
  };
}
