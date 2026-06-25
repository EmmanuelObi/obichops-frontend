"use client";

import { formatNaira } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ExcessAcknowledgeModalProps {
  open: boolean;
  excessCents: number;
  totalCents: number;
  budgetPoolCents: number;
  isPooled: boolean;
  orderDayCount: number;
  maxOrderAmountCents: number;
  acknowledged: boolean;
  onAcknowledgedChange: (value: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
  submitting?: boolean;
}

export function ExcessAcknowledgeModal({
  open,
  excessCents,
  totalCents,
  budgetPoolCents,
  isPooled,
  orderDayCount,
  maxOrderAmountCents,
  acknowledged,
  onAcknowledgedChange,
  onCancel,
  onConfirm,
  submitting,
}: ExcessAcknowledgeModalProps) {
  const allowanceDescription = isPooled
    ? `Your order total of ${formatNaira(totalCents)} exceeds your ${formatNaira(budgetPoolCents)} allowance (${orderDayCount} days × ${formatNaira(maxOrderAmountCents)} per day).`
    : `Your order total of ${formatNaira(totalCents)} exceeds the ${formatNaira(maxOrderAmountCents)} daily allowance.`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Over budget</DialogTitle>
          <DialogDescription>
            {allowanceDescription} You will need to pay{" "}
            {formatNaira(excessCents)} excess separately.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-3 rounded-lg border p-4">
          <Checkbox
            id="excess-ack"
            checked={acknowledged}
            onCheckedChange={(checked) => onAcknowledgedChange(checked === true)}
          />
          <Label htmlFor="excess-ack" className="leading-snug">
            I acknowledge I will pay the excess of {formatNaira(excessCents)}.
          </Label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="premium"
            size="lg"
            className="h-11 rounded-lg"
            onClick={onConfirm}
            disabled={!acknowledged || submitting}
          >
            {submitting ? "Submitting…" : "Submit order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
