"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { apiClient } from "@/lib/api-client";
import {
  PLATFORM_WORKSPACE_CHANGED_EVENT,
  readPlatformWorkspaceFromCookies,
} from "@/lib/platform-workspace";
import type { AuthUser } from "@/types/auth";

function titleFromSlug(slug?: string | null): string | null {
  if (!slug) return null;
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function useWorkspaceBrand() {
  const { data: session } = useSession();
  const platformWorkspace = readPlatformWorkspaceFromCookies();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const sessionWorkspaceId = session?.user?.workspaceId ?? null;
  const effectiveWorkspaceId =
    sessionWorkspaceId ?? (isSuperAdmin ? platformWorkspace?.id ?? null : null);

  const [workspaceName, setWorkspaceName] = useState<string | null>(
    session?.user?.workspaceName ??
      (isSuperAdmin ? platformWorkspace?.name ?? null : null),
  );

  const workspaceId = effectiveWorkspaceId;
  const workspaceSlug =
    session?.user?.workspaceSlug ??
    (isSuperAdmin ? platformWorkspace?.slug ?? null : null);
  const hasWorkspace = Boolean(workspaceId);
  const isManagingWorkspace =
    isSuperAdmin && !sessionWorkspaceId && Boolean(platformWorkspace?.id);

  useEffect(() => {
    const fromSession = session?.user?.workspaceName;
    if (fromSession) {
      setWorkspaceName(fromSession);
      return;
    }

    if (isManagingWorkspace && platformWorkspace?.name) {
      setWorkspaceName(platformWorkspace.name);
      return;
    }

    if (!hasWorkspace || !session?.accessToken) {
      setWorkspaceName(null);
      return;
    }

    let cancelled = false;

    void apiClient(session.accessToken)
      .get<{ user: AuthUser }>("/auth/me")
      .then((data) => {
        if (cancelled) return;
        setWorkspaceName(
          data.user.workspaceName ?? titleFromSlug(data.user.workspaceSlug),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setWorkspaceName(titleFromSlug(workspaceSlug));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    hasWorkspace,
    isManagingWorkspace,
    platformWorkspace?.name,
    session?.accessToken,
    session?.user?.workspaceName,
    workspaceSlug,
  ]);

  useEffect(() => {
    if (!isSuperAdmin || sessionWorkspaceId) return;
    const handler = () => {
      const next = readPlatformWorkspaceFromCookies();
      setWorkspaceName(next?.name ?? null);
    };
    window.addEventListener(PLATFORM_WORKSPACE_CHANGED_EVENT, handler);
    return () =>
      window.removeEventListener(PLATFORM_WORKSPACE_CHANGED_EVENT, handler);
  }, [isSuperAdmin, sessionWorkspaceId]);

  const displayName =
    workspaceName ??
    titleFromSlug(workspaceSlug) ??
    (hasWorkspace ? "Your company" : "Obi's Chops");

  return {
    displayName,
    hasWorkspace,
    isPlatformUser: !hasWorkspace,
    isManagingWorkspace,
  };
}
