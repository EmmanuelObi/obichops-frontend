export const statusBadgeBase =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset";

export const statusBadgeVariants: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground ring-border",
  OPEN: "bg-success/15 text-success ring-success/25",
  CLOSED: "bg-muted text-muted-foreground ring-border",
  UPCOMING: "bg-warning/15 text-warning-foreground ring-warning/25",
  SUBMITTED: "bg-info/15 text-info ring-info/25",
  cancelled: "bg-destructive/10 text-destructive ring-destructive/20",
};

export function statusBadgeClass(status: string): string {
  const key = status.toUpperCase();
  return statusBadgeVariants[key] ?? statusBadgeVariants[status] ?? "bg-muted text-muted-foreground ring-border";
}
