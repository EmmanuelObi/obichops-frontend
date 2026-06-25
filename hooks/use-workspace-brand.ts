"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { apiClient } from "@/lib/api-client";
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
  const [workspaceName, setWorkspaceName] = useState<string | null>(
    session?.user?.workspaceName ?? null,
  );

  const workspaceId = session?.user?.workspaceId ?? null;
  const workspaceSlug = session?.user?.workspaceSlug ?? null;
  const hasWorkspace = Boolean(workspaceId);

  useEffect(() => {
    const fromSession = session?.user?.workspaceName;
    if (fromSession) {
      setWorkspaceName(fromSession);
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
  }, [hasWorkspace, session?.accessToken, session?.user?.workspaceName, workspaceSlug]);

  const displayName =
    workspaceName ??
    titleFromSlug(workspaceSlug) ??
    (hasWorkspace ? "Your company" : "Obi's Chops");

  return {
    displayName,
    hasWorkspace,
    isPlatformUser: !hasWorkspace,
  };
}
