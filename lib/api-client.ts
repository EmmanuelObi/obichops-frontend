import {
  notifyUnauthorized,
  shouldSignOutOnUnauthorized,
} from "@/lib/unauthorized-handler";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiFetchOptions = RequestInit & {
  token?: string | null;
  json?: unknown;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { token, json, headers, body, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(json !== undefined || body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : body,
  });

  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : null) ??
      (payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : null) ??
      response.statusText;

    const errorMessage = message || "Request failed";
    if (shouldSignOutOnUnauthorized(response.status, errorMessage, Boolean(token))) {
      notifyUnauthorized();
    }

    throw new ApiError(response.status, errorMessage, payload);
  }

  return payload as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function apiClient(token?: string | null) {
  return {
    get: <T>(path: string, init?: RequestInit) =>
      apiFetch<T>(path, { ...init, method: "GET", token }),
    post: <T>(path: string, json?: unknown, init?: RequestInit) =>
      apiFetch<T>(path, { ...init, method: "POST", json, token }),
    put: <T>(path: string, json?: unknown, init?: RequestInit) =>
      apiFetch<T>(path, { ...init, method: "PUT", json, token }),
    patch: <T>(path: string, json?: unknown, init?: RequestInit) =>
      apiFetch<T>(path, { ...init, method: "PATCH", json, token }),
    delete: <T>(path: string, init?: RequestInit) =>
      apiFetch<T>(path, { ...init, method: "DELETE", token }),
  };
}
