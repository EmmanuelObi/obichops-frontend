import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  size?: "default" | "narrow";
  className?: string;
}

export function PageContainer({
  children,
  size = "default",
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full animate-in-up px-4 py-8 sm:px-6 lg:px-8",
        size === "narrow" ? "max-w-3xl" : "max-w-5xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
