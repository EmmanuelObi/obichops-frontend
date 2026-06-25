export const premium = {
  page: "min-h-screen premium-surface",
  pageInner: "mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8",
  heading:
    "font-serif text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl",
  subheading: "text-base leading-relaxed text-muted-foreground sm:text-lg",
  card: "rounded-xl border border-border/70 bg-card shadow-premium",
  cardHover:
    "rounded-xl border border-border/70 bg-card shadow-premium transition-all duration-200 ease-[var(--ease-out-expo)] hover:-translate-y-px hover:border-gold/25 hover:shadow-premium-lg",
  panel: "rounded-xl border border-border/60 bg-card p-6 shadow-premium",
  label: "text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground",
  labelAccent:
    "text-[11px] font-semibold uppercase tracking-[0.14em] text-gold",
  input:
    "box-border block h-10 w-full rounded-lg border border-input bg-background px-4 text-sm shadow-inner-soft transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground focus:border-primary/35 focus:outline-none focus:ring-[3px] focus:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50",
  navItem:
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground",
  navItemActive:
    "flex items-center gap-3 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-foreground ring-1 ring-border/60",
  statPill:
    "inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm",
} as const;
