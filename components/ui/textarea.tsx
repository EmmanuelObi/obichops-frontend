import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "box-border block min-h-[72px] w-full rounded-lg border border-input bg-background px-4 py-2 text-sm shadow-inner-soft transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground focus:border-primary/35 focus:outline-none focus:ring-[3px] focus:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
