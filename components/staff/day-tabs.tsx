import { DAY_LABELS, type DayOfWeek } from "@/types/vendor";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface DayTabsProps {
  orderableDays: DayOfWeek[];
  activeDay: DayOfWeek;
  onDayChange: (day: DayOfWeek) => void;
  daysWithItems?: DayOfWeek[];
  lockedDays?: DayOfWeek[];
}

export function DayTabs({
  orderableDays,
  activeDay,
  onDayChange,
  daysWithItems = [],
  lockedDays = [],
}: DayTabsProps) {
  const itemDays = new Set(daysWithItems);
  const locked = new Set(lockedDays);

  return (
    <Tabs
      value={activeDay}
      onValueChange={(value) => onDayChange(value as DayOfWeek)}
    >
      <TabsList className="flex h-auto w-full flex-wrap gap-1 p-1">
        {orderableDays.map((day) => (
          <TabsTrigger
            key={day}
            value={day}
            className={cn(
              "min-h-10 flex-1 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
              locked.has(day) && "opacity-50",
            )}
            title={
              locked.has(day)
                ? "You've used all order days for this week"
                : undefined
            }
          >
            <span className="relative">
              {DAY_LABELS[day]}
              {itemDays.has(day) ? (
                <span
                  className={cn(
                    "absolute -top-1 -right-2 size-2 rounded-full",
                    activeDay === day ? "bg-primary-foreground" : "bg-primary",
                  )}
                />
              ) : null}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
