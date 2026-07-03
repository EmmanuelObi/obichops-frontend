"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { apiClient } from "@/lib/api-client";
import {
  PLATFORM_WORKSPACE_CHANGED_EVENT,
  clearPlatformWorkspaceCookies,
  readPlatformWorkspaceFromCookies,
  setPlatformWorkspaceCookies,
  type PlatformWorkspaceSelection,
} from "@/lib/platform-workspace";

export function usePlatformWorkspace() {
  const router = useRouter();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const sessionWorkspaceId = session?.user?.workspaceId ?? null;
  const [selection, setSelection] = useState<PlatformWorkspaceSelection | null>(
    null,
  );

  const syncFromCookies = useCallback(() => {
    if (!isSuperAdmin || sessionWorkspaceId) {
      setSelection(null);
      return;
    }
    setSelection(readPlatformWorkspaceFromCookies());
  }, [isSuperAdmin, sessionWorkspaceId]);

  useEffect(() => {
    syncFromCookies();
  }, [syncFromCookies]);

  useEffect(() => {
    if (!isSuperAdmin || sessionWorkspaceId) return;
    const handler = () => syncFromCookies();
    window.addEventListener(PLATFORM_WORKSPACE_CHANGED_EVENT, handler);
    return () =>
      window.removeEventListener(PLATFORM_WORKSPACE_CHANGED_EVENT, handler);
  }, [isSuperAdmin, sessionWorkspaceId, syncFromCookies]);

  const enterWorkspace = useCallback(
    (workspace: PlatformWorkspaceSelection, redirectTo = "/admin") => {
      if (!isSuperAdmin) return;
      setPlatformWorkspaceCookies(workspace);
      setSelection(workspace);

      const token = session?.accessToken;
      if (token) {
        void apiClient(token)
          .post(`/platform/workspaces/${workspace.id}/enter`)
          .catch(() => undefined);
      }

      router.push(redirectTo);
      router.refresh();
    },
    [isSuperAdmin, router, session?.accessToken],
  );

  const exitWorkspace = useCallback(() => {
    clearPlatformWorkspaceCookies();
    setSelection(null);
    router.push("/platform/workspaces");
    router.refresh();
  }, [router]);

  const switchWorkspace = useCallback(
    (workspace: PlatformWorkspaceSelection) => {
      if (!isSuperAdmin) return;
      setPlatformWorkspaceCookies(workspace);
      setSelection(workspace);
      router.refresh();
    },
    [isSuperAdmin, router],
  );

  const isManagingWorkspace = isSuperAdmin && !sessionWorkspaceId && Boolean(selection);

  return {
    selection,
    isManagingWorkspace,
    enterWorkspace,
    exitWorkspace,
    switchWorkspace,
  };
}
