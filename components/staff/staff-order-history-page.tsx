"use client";

import { DateTime } from "luxon";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";

import type { StaffOrderHistoryEntry } from "@/types/order";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  openExcessPaymentProof,
  uploadExcessPaymentProof,
} from "@/lib/excess-payment";
import { apiClient } from "@/lib/api-client";
import { formatNaira } from "@/lib/format";
import { excessPaymentStatusLabel } from "@/lib/labels";
import { DAY_LABELS, type DayOfWeek } from "@/types/vendor";
import type { StaffOrderHistoryResponse } from "@/types/order";
import { VendorReviewForm } from "@/components/staff/vendor-review-form";

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full rounded-xl" />
      {Array.from({ length: 2 }).map((_, index) => (
        <Skeleton key={index} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}

function ExcessPaymentActions({
  entry,
  onUpdated,
}: {
  entry: StaffOrderHistoryEntry;
  onUpdated: () => Promise<void>;
}) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (entry.order.excessCents <= 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  async function handleUpload(file: File) {
    if (!token) return;
    setUploading(true);
    try {
      await uploadExcessPaymentProof(entry.order.id, file, token);
      toast.success("Payment proof submitted for review");
      await onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleViewProof() {
    if (!token) return;
    try {
      await openExcessPaymentProof(
        `/orders/me/${entry.order.id}/excess-payment-proof`,
        token,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open proof");
    }
  }

  const canUploadLegacy =
    entry.order.excessPaymentStatus === "OUTSTANDING" &&
    !entry.order.hasExcessPaymentProof;
  const canViewProof = entry.order.hasExcessPaymentProof;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant={
          entry.order.excessPaymentStatus === "PAID"
            ? "default"
            : entry.order.excessPaymentStatus === "PROOF_UPLOADED"
              ? "secondary"
              : "secondary"
        }
      >
        {excessPaymentStatusLabel(entry.order.excessPaymentStatus)}
      </Badge>
      {canUploadLegacy ? (
        <>
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
          <Button
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" />
            {uploading ? "Uploading…" : "Upload proof"}
          </Button>
        </>
      ) : null}
      {canViewProof ? (
        <Button size="sm" variant="outline" onClick={() => void handleViewProof()}>
          <ExternalLink className="size-4" />
          View proof
        </Button>
      ) : null}
    </div>
  );
}

export function StaffOrderHistoryPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [data, setData] = useState<StaffOrderHistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient(token).get<StaffOrderHistoryResponse>(
        "/orders/me/history",
      );
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order history");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <HistorySkeleton />;
  }

  return (
    <div className="animate-fade-in space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {data && data.outstandingOrderCount > 0 ? (
        <Alert variant="warning">
          <AlertDescription>
            You have {formatNaira(data.outstandingExcessCents)} in outstanding
            excess across {data.outstandingOrderCount}{" "}
            {data.outstandingOrderCount === 1 ? "order" : "orders"}. Upload proof
            of payment below — your admin will mark it as paid after review.
          </AlertDescription>
        </Alert>
      ) : null}

      {!data || data.orders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No submitted orders yet. Your past weeks will appear here after you
            submit an order.
          </CardContent>
        </Card>
      ) : (
        <div className="stagger-children space-y-6">
        {data.orders.map((entry) => {
          const weekLabel = DateTime.fromISO(entry.menuWeek.weekStart)
            .setZone(entry.menuWeek.timezone)
            .toFormat("d LLL yyyy");

          return (
            <Card key={entry.order.id}>
              <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Week of {weekLabel}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {entry.vendor?.name ?? "Vendor"} · Submitted{" "}
                      {entry.order.submittedAt
                        ? DateTime.fromISO(entry.order.submittedAt).toFormat(
                            "d LLL yyyy, h:mm a",
                          )
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {formatNaira(entry.order.totalCents)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Covered {formatNaira(entry.order.companyCoveredCents)}
                    </p>
                  </div>
                </div>
                {entry.order.excessCents > 0 ? (
                  <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Excess {formatNaira(entry.order.excessCents)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Amount you agreed to pay above your company allowance for
                        this week.
                      </p>
                    </div>
                    <ExcessPaymentActions entry={entry} onUpdated={load} />
                  </div>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-2">
                {entry.lineItems.map((line) => (
                  <div
                    key={`${line.menuItemId}-${line.dayOfWeek}`}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span>
                      {DAY_LABELS[line.dayOfWeek as DayOfWeek]} · {line.name} ×{" "}
                      {line.quantity}
                    </span>
                    <span className="text-muted-foreground">
                      {formatNaira(
                        (line.unitPriceCentsSnapshot ?? 0) * line.quantity,
                      )}
                    </span>
                  </div>
                ))}
                {entry.order.excessPaymentStatus === "PROOF_UPLOADED" ? (
                  <p className="flex items-center gap-1 pt-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3.5 text-warning-foreground" />
                    Proof submitted for review
                    {entry.order.excessPaymentProofUploadedAt
                      ? ` on ${DateTime.fromISO(
                          entry.order.excessPaymentProofUploadedAt,
                        ).toFormat("d LLL yyyy, h:mm a")}`
                      : ""}
                  </p>
                ) : null}
                {entry.order.excessPaymentStatus === "PAID" ? (
                  <p className="flex items-center gap-1 pt-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3.5 text-success" />
                    Marked as paid
                    {entry.order.excessPaidAt
                      ? ` on ${DateTime.fromISO(entry.order.excessPaidAt).toFormat(
                          "d LLL yyyy, h:mm a",
                        )}`
                      : ""}
                  </p>
                ) : null}
                {entry.canReview && entry.vendor ? (
                  <div className="pt-4">
                    <VendorReviewForm
                      menuWeekId={entry.menuWeek.id}
                      vendorName={entry.vendor.name}
                      review={entry.review}
                      onSaved={load}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
        </div>
      )}
    </div>
  );
}
