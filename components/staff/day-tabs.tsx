import { DAY_LABELS, type DayOfWeek } from "@/types/vendor";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { orderDayLimitMessage } from "@/lib/order-day-limit";
import { cn } from "@/lib/utils";

interface DayTabsProps {
  orderableDays: DayOfWeek[];
  activeDay: DayOfWeek;
  onDayChange: (day: DayOfWeek) => void;
  daysWithItems?: DayOfWeek[];
  lockedDays?: DayOfWeek[];
  maxOrderDays?: number;
}

export function DayTabs({
  orderableDays,
  activeDay,
  onDayChange,
  daysWithItems = [],
  lockedDays = [],
  maxOrderDays = 2,
}: DayTabsProps) {
  const itemDays = new Set(daysWithItems);
  const locked = new Set(lockedDays);
  const lockedMessage = orderDayLimitMessage(maxOrderDays, "tab");

  return (
    <Tabs
      value={activeDay}
      onValueChange={(value) => onDayChange(value as DayOfWeek)}
    >
      <TabsList className="flex h-auto w-full flex-wrap gap-1 p-1">
        {orderableDays.map((day) => {
          const trigger = (
            <TabsTrigger
              key={day}
              value={day}
              className={cn(
                "min-h-10 flex-1 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                locked.has(day) && "opacity-50",
              )}
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
          );

          if (!locked.has(day)) {
            return trigger;
          }

          return (
            <Tooltip key={day}>
              <TooltipTrigger render={trigger} />
              <TooltipContent side="top" className="max-w-xs">
                {lockedMessage}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
