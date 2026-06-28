"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";
import { toast } from "sonner";

import type { CurrentMenuWeekResponse } from "@/types/menu-week";
import type { StaffOrder } from "@/types/order";
import type { DayOfWeek } from "@/types/vendor";
import type { ProxyOrderRecipient } from "@/types/proxy-order";
import { toProxyOrderRecipientPayload } from "@/types/proxy-order";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import {
  uploadExcessPaymentProof,
  validateExcessPaymentFile,
} from "@/lib/excess-payment";
import { formatNaira } from "@/lib/format";
import { vendorHasPaymentDetails } from "@/lib/vendor-payment";

type CartLine = { menuItemId: string; dayOfWeek: DayOfWeek; quantity: number };

interface AdminProxyExcessModalProps {
  open: boolean;
  weekId: string;
  recipient: ProxyOrderRecipient;
  excessCents: number;
  totalCents: number;
  budgetPoolCents: number;
  isPooled: boolean;
  orderDayCount: number;
  maxOrderAmountCents: number;
  cart: CartLine[];
  vendor: CurrentMenuWeekResponse["vendor"];
  token: string | undefined;
  onCancel: () => void;
  onConfirm: () => void;
  onOrderUpdated: (order: StaffOrder) => void;
  submitting?: boolean;
}

export function AdminProxyExcessModal({
  open,
  weekId,
  recipient,
  excessCents,
  totalCents,
  budgetPoolCents,
  isPooled,
  orderDayCount,
  maxOrderAmountCents,
  cart,
  vendor,
  token,
  onCancel,
  onConfirm,
  onOrderUpdated,
  submitting,
}: AdminProxyExcessModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [proofFilename, setProofFilename] = useState<string | null>(null);
  const [prepareError, setPrepareError] = useState<string | null>(null);

  const hasVendorPaymentDetails = vendorHasPaymentDetails(vendor);

  const prepareDraft = useCallback(async () => {
    if (!token || cart.length === 0) return;
    setPreparing(true);
    setPrepareError(null);
    try {
      const result = await apiClient(token).put<{ order: StaffOrder }>(
        `/admin/menu-weeks/${weekId}/proxy-order`,
        {
          recipient: toProxyOrderRecipientPayload(recipient),
          lineItems: cart,
        },
      );
      setOrderId(result.order.id);
      onOrderUpdated(result.order);
      if (result.order.hasExcessPaymentProof) {
        setProofFilename(result.order.excessPaymentProofFilename ?? "Uploaded file");
      } else {
        setProofFilename(null);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save order draft";
      setPrepareError(message);
      setOrderId(null);
      setProofFilename(null);
    } finally {
      setPreparing(false);
    }
  }, [token, cart, weekId, recipient, onOrderUpdated]);

  useEffect(() => {
    if (open) {
      void prepareDraft();
    } else {
      setOrderId(null);
      setProofFilename(null);
      setPrepareError(null);
    }
  }, [open, prepareDraft]);

  const allowanceDescription = isPooled
    ? `This order total of ${formatNaira(totalCents)} exceeds the ${formatNaira(budgetPoolCents)} allowance (${orderDayCount} days × ${formatNaira(maxOrderAmountCents)} per day).`
    : `This order total of ${formatNaira(totalCents)} exceeds the ${formatNaira(maxOrderAmountCents)} daily allowance.`;

  async function handleUpload(file: File) {
    if (!token || !orderId) return;
    const validationError = validateExcessPaymentFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setUploading(true);
    try {
      await uploadExcessPaymentProof(orderId, file, token, { apiPrefix: "admin" });
      setProofFilename(file.name);
      const orderData = await apiClient(token).get<{
        order: StaffOrder | null;
      }>(`/admin/menu-weeks/${weekId}/proxy-order?orderId=${orderId}`);
      if (orderData.order) {
        onOrderUpdated(orderData.order);
      }
      toast.success("Payment proof uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  const canSubmit =
    Boolean(proofFilename) &&
    Boolean(orderId) &&
    hasVendorPaymentDetails &&
    !preparing &&
    !uploading;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay excess before submitting</DialogTitle>
          <DialogDescription>
            {allowanceDescription} Pay{" "}
            <span className="font-medium text-foreground">
              {formatNaira(excessCents)}
            </span>{" "}
            to the vendor below, then upload payment proof for{" "}
            <span className="font-medium text-foreground">
              {recipient.displayName}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        {prepareError ? (
          <Alert variant="destructive">
            <AlertDescription>{prepareError}</AlertDescription>
          </Alert>
        ) : null}

        {!hasVendorPaymentDetails ? (
          <Alert variant="destructive">
            <AlertDescription>
              This vendor&apos;s payment details are not configured. Add bank
              details before submitting an order with excess.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="font-medium">Pay to {vendor?.name}</p>
            <dl className="space-y-1">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Account name</dt>
                <dd className="text-right font-medium">{vendor?.accountName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Bank</dt>
                <dd className="text-right font-medium">{vendor?.bankName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Account number</dt>
                <dd className="font-mono text-right font-medium tracking-wide">
                  {vendor?.accountNumber}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
          {proofFilename ? (
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>
                Proof uploaded: <span className="font-medium">{proofFilename}</span>
              </span>
            </div>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={
              preparing || uploading || !orderId || !hasVendorPaymentDetails
            }
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" />
            {uploading
              ? "Uploading…"
              : proofFilename
                ? "Replace proof"
                : "Upload payment proof"}
          </Button>
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
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Submitting…" : "Submit order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
