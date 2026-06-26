type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let isHandlingUnauthorized = false;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

export function clearUnauthorizedHandler(): void {
  unauthorizedHandler = null;
}

const SESSION_EXPIRED_ERRORS = new Set([
  "Invalid or expired token",
  "Unauthorized",
]);

export function shouldSignOutOnUnauthorized(
  status: number,
  message: string,
  hadToken: boolean,
): boolean {
  if (status !== 401 || !hadToken) return false;
  return SESSION_EXPIRED_ERRORS.has(message);
}

export function notifyUnauthorized(): void {
  if (typeof window === "undefined" || isHandlingUnauthorized) return;
  if (!unauthorizedHandler) return;

  isHandlingUnauthorized = true;
  try {
    unauthorizedHandler();
  } finally {
    window.setTimeout(() => {
      isHandlingUnauthorized = false;
    }, 2000);
  }
}
