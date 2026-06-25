import { ShoppingBag } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageLoadingProps {
  variant?: "app" | "auth" | "minimal";
  className?: string;
}

export function PageLoading({ variant = "app", className }: PageLoadingProps) {
  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center justify-center py-24", className)}>
        <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (variant === "auth") {
    return (
      <div
        className={cn(
          "flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 animate-fade-in",
          className,
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-full border border-gold/25 bg-primary text-primary-foreground shadow-premium animate-pulse-soft">
          <ShoppingBag className="size-7" strokeWidth={1.75} />
        </div>
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8", className)}>
      <div className="mb-8 space-y-3 border-b border-border/60 pb-6">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 max-w-full rounded-md" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
