import { auth } from "@/auth";
import type { Role } from "@/types/auth";
import type { Session } from "next-auth";

import { apiClient } from "@/lib/api-client";

export async function getServerSession() {
  return auth();
}

export async function getServerAccessToken() {
  const session = await auth();
  return session?.accessToken ?? null;
}

export async function getAuthenticatedApiClient() {
  const token = await getServerAccessToken();
  return apiClient(token);
}

export function getAccessToken(session: Session | null | undefined) {
  return session?.accessToken ?? null;
}

export function getUserRole(session: Session | null | undefined): Role | null {
  return session?.user?.role ?? null;
}

export function hasRole(
  session: Session | null | undefined,
  roles: Role | Role[],
): boolean {
  const role = getUserRole(session);
  if (!role) return false;
  const allowed = Array.isArray(roles) ? roles : [roles];
  return allowed.includes(role);
}

export function isSuperAdmin(session: Session | null | undefined) {
  return hasRole(session, "SUPER_ADMIN");
}

export function isAdmin(session: Session | null | undefined) {
  return hasRole(session, ["SUPER_ADMIN", "ADMIN"]);
}
