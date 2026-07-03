import { cookies } from "next/headers";

import {
  PLATFORM_WORKSPACE_COOKIE_ID,
  PLATFORM_WORKSPACE_COOKIE_NAME,
  PLATFORM_WORKSPACE_COOKIE_SLUG,
  type PlatformWorkspaceSelection,
} from "@/lib/platform-workspace";

export async function readPlatformWorkspaceFromServerCookies(): Promise<PlatformWorkspaceSelection | null> {
  const cookieStore = await cookies();
  const id = cookieStore.get(PLATFORM_WORKSPACE_COOKIE_ID)?.value;
  if (!id) return null;

  return {
    id,
    name: cookieStore.get(PLATFORM_WORKSPACE_COOKIE_NAME)?.value ?? id,
    slug: cookieStore.get(PLATFORM_WORKSPACE_COOKIE_SLUG)?.value ?? id,
  };
}

export async function hasPlatformWorkspaceContext(
  sessionWorkspaceId?: string | null,
): Promise<boolean> {
  if (sessionWorkspaceId) return true;
  const platformWorkspace = await readPlatformWorkspaceFromServerCookies();
  return Boolean(platformWorkspace?.id);
}
