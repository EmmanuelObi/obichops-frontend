import type { AuthResponse } from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  workspaceSlug?: string;
}

export async function registerWithCredentials(input: RegisterInput) {
  const email = input.email.trim().toLowerCase();
  const workspaceSlug = input.workspaceSlug?.trim().toLowerCase();

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: input.password,
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(workspaceSlug ? { workspaceSlug } : {}),
    }),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error: unknown }).error)
          : null) ?? "Registration failed";
    throw new Error(message);
  }

  return payload as AuthResponse;
}

export async function requestPasswordReset(
  email: string,
  workspaceSlug?: string,
) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      ...(workspaceSlug
        ? { workspaceSlug: workspaceSlug.trim().toLowerCase() }
        : {}),
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error: unknown }).error)
          : null) ?? "Unable to send reset email";
    throw new Error(message);
  }
}

export async function resetPassword(token: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error: unknown }).error)
          : null) ?? "Unable to reset password";
    throw new Error(message);
  }
}

export async function changePassword(
  token: string,
  newPassword: string,
  profile?: { firstName: string; lastName: string },
  currentPassword?: string,
) {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...(currentPassword ? { currentPassword } : {}),
      newPassword,
      ...(profile
        ? { firstName: profile.firstName.trim(), lastName: profile.lastName.trim() }
        : {}),
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error: unknown }).error)
          : null) ?? "Unable to change password";
    throw new Error(message);
  }

  return payload;
}
