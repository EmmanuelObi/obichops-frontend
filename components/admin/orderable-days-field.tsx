"use client";

import type { DayOfWeek } from "@/types/vendor";
import { DAY_LABELS, DAYS_OF_WEEK } from "@/types/vendor";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const DEFAULT_WEEKDAYS = DAYS_OF_WEEK.filter(
  (day) => day !== "SAT" && day !== "SUN",
);

interface OrderableDaysFieldProps {
  value: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
  className?: string;
}

export function OrderableDaysField({
  value,
  onChange,
  className,
}: OrderableDaysFieldProps) {
  function toggleDay(day: DayOfWeek) {
    if (value.includes(day)) {
      if (value.length === 1) return;
      onChange(value.filter((d) => d !== day));
      return;
    }

    onChange(
      [...value, day].sort(
        (a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b),
      ),
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium">Orderable days</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {DEFAULT_WEEKDAYS.map((day) => {
          const checked = value.includes(day);
          return (
            <label
              key={day}
              className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggleDay(day)}
              />
              {DAY_LABELS[day]}
            </label>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Staff can only order meals on the days you select.
      </p>
    </div>
  );
}

export const DEFAULT_ORDERABLE_DAYS: DayOfWeek[] = [...DEFAULT_WEEKDAYS];
