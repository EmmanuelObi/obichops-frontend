export const PLATFORM_WORKSPACE_COOKIE_ID = "platform-workspace-id";
export const PLATFORM_WORKSPACE_COOKIE_NAME = "platform-workspace-name";
export const PLATFORM_WORKSPACE_COOKIE_SLUG = "platform-workspace-slug";

export interface PlatformWorkspaceSelection {
  id: string;
  name: string;
  slug: string;
}

export const PLATFORM_WORKSPACE_CHANGED_EVENT = "platform-workspace-changed";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function readPlatformWorkspaceFromCookies(): PlatformWorkspaceSelection | null {
  const id = readCookie(PLATFORM_WORKSPACE_COOKIE_ID);
  if (!id) return null;
  return {
    id,
    name: readCookie(PLATFORM_WORKSPACE_COOKIE_NAME) ?? id,
    slug: readCookie(PLATFORM_WORKSPACE_COOKIE_SLUG) ?? id,
  };
}

export function setPlatformWorkspaceCookies(
  chopspace: PlatformWorkspaceSelection,
): void {
  const maxAge = 60 * 60 * 24 * 30;
  const base = `path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `${PLATFORM_WORKSPACE_COOKIE_ID}=${encodeURIComponent(chopspace.id)}; ${base}`;
  document.cookie = `${PLATFORM_WORKSPACE_COOKIE_NAME}=${encodeURIComponent(chopspace.name)}; ${base}`;
  document.cookie = `${PLATFORM_WORKSPACE_COOKIE_SLUG}=${encodeURIComponent(chopspace.slug)}; ${base}`;
  window.dispatchEvent(new Event(PLATFORM_WORKSPACE_CHANGED_EVENT));
}

export function clearPlatformWorkspaceCookies(): void {
  const base = "path=/; max-age=0; SameSite=Lax";
  document.cookie = `${PLATFORM_WORKSPACE_COOKIE_ID}=; ${base}`;
  document.cookie = `${PLATFORM_WORKSPACE_COOKIE_NAME}=; ${base}`;
  document.cookie = `${PLATFORM_WORKSPACE_COOKIE_SLUG}=; ${base}`;
  window.dispatchEvent(new Event(PLATFORM_WORKSPACE_CHANGED_EVENT));
}

export function getPlatformWorkspaceIdForApi(): string | null {
  return readPlatformWorkspaceFromCookies()?.id ?? null;
}
