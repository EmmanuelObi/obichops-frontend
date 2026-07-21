import { Check } from "lucide-react";

import { DAY_LABELS, type DayOfWeek } from "@/types/vendor";
import { cn } from "@/lib/utils";

const DAY_SHORT: Record<DayOfWeek, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

interface OrderDayProgressProps {
  orderableDays: DayOfWeek[];
  daysWithItems: DayOfWeek[];
  maxOrderDays: number;
  className?: string;
}

export function OrderDayProgress({
  orderableDays,
  daysWithItems,
  maxOrderDays,
  className,
}: OrderDayProgressProps) {
  const filled = new Set(daysWithItems);
  const used = daysWithItems.length;

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-xs font-medium text-muted-foreground">
        {used} of {maxOrderDays} order {maxOrderDays === 1 ? "day" : "days"}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {orderableDays.map((day) => {
          const isFilled = filled.has(day);
          return (
            <span
              key={day}
              title={DAY_LABELS[day]}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
                isFilled
                  ? "border-primary/25 bg-primary/10 text-primary"
                  : "border-border/80 bg-muted/40 text-muted-foreground",
              )}
            >
              {isFilled ? <Check className="size-3" aria-hidden /> : null}
              {DAY_SHORT[day]}
            </span>
          );
        })}
      </div>
    </div>
  );
}
