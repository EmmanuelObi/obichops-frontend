import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface BudgetBarProps {
  totalCents: number;
  companyCoveredCents: number;
  maxOrderAmountCents: number;
  excessCents: number;
  orderDayCount: number;
  budgetPoolCents: number;
  isPooled: boolean;
  maxOrderDaysPerStaff: number;
}

export function BudgetBar({
  totalCents,
  companyCoveredCents,
  maxOrderAmountCents,
  excessCents,
  orderDayCount,
  budgetPoolCents,
  isPooled,
  maxOrderDaysPerStaff,
}: BudgetBarProps) {
  const progress = Math.min(
    100,
    budgetPoolCents > 0
      ? Math.round((companyCoveredCents / budgetPoolCents) * 100)
      : 0,
  );
  const isOverBudget = excessCents > 0;

  const budgetLabel = isPooled
    ? `${orderDayCount} days × ${formatNaira(maxOrderAmountCents)}`
    : `Daily cap ${formatNaira(maxOrderAmountCents)}`;

  return (
    <div className="sticky top-0 z-10 space-y-2 rounded-xl border bg-background/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">Company budget</span>
        <span className="text-right">
          {formatNaira(companyCoveredCents)} of {formatNaira(budgetPoolCents)}
        </span>
      </div>
      <Progress
        value={progress}
        className={cn(isOverBudget && "[&>div]:bg-warning")}
      />
      <p className="text-sm text-muted-foreground">
        Cart total: {formatNaira(totalCents)}
        <span className="mx-1">·</span>
        {budgetLabel}
        <span className="mx-1">·</span>
        {orderDayCount} of {maxOrderDaysPerStaff} order{" "}
        {maxOrderDaysPerStaff === 1 ? "day" : "days"} used
        {isOverBudget ? (
          <span className="text-warning-foreground">
            {" "}
            · Excess {formatNaira(excessCents)}
          </span>
        ) : null}
      </p>
    </div>
  );
}
