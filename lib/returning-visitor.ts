export const RETURNING_VISITOR_COOKIE = "obi_chops_returning";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Mark this browser as a returning visitor (shown login instead of landing). */
export function markReturningVisitor(): void {
  if (typeof document === "undefined") return;
  document.cookie = [
    `${RETURNING_VISITOR_COOKIE}=1`,
    "path=/",
    `max-age=${ONE_YEAR_SECONDS}`,
    "SameSite=Lax",
  ].join("; ");
}
