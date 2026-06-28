"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ClipboardList, UserPlus } from "lucide-react";
import { toast } from "sonner";

import type { AdminWeekOrder } from "@/types/order";
import type { ReminderLogEntry } from "@/types/reminders";
import { reminderLabel } from "@/types/reminders";
import { EmptyState } from "@/components/layout/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { openExcessPaymentProof } from "@/lib/excess-payment";
import { apiClient } from "@/lib/api-client";
import { downloadAuthenticatedFile } from "@/lib/download";
import { formatNaira } from "@/lib/format";
import { excessPaymentStatusLabel, orderStatusLabel } from "@/lib/labels";

interface WeekOrdersManagerProps {
  weekId: string;
}

export function WeekOrdersManager({ weekId }: WeekOrdersManagerProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [orders, setOrders] = useState<AdminWeekOrder[]>([]);
  const [reminders, setReminders] = useState<ReminderLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [excessOnly, setExcessOnly] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const query = excessOnly ? "?hasExcess=true" : "";
      const [ordersRes, remindersRes] = await Promise.all([
        apiClient(token).get<{ orders: AdminWeekOrder[] }>(
          `/admin/menu-weeks/${weekId}/orders${query}`,
        ),
        apiClient(token).get<{ reminders: ReminderLogEntry[] }>(
          `/admin/menu-weeks/${weekId}/reminders`,
        ),
      ]);
      setOrders(ordersRes.orders);
      setReminders(remindersRes.reminders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [token, weekId, excessOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  const submittedCount = orders.filter((o) => o.status === "SUBMITTED").length;
  const excessTotal = orders.reduce((sum, o) => sum + o.excessCents, 0);

  async function handleDownload(format: "csv" | "pdf") {
    if (!token) return;
    setError(null);
    try {
      await downloadAuthenticatedFile(
        `/admin/menu-weeks/${weekId}/export?format=${format}`,
        token,
        `orders.${format}`,
      );
      toast.success(`Downloaded ${format.toUpperCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  }

  async function handleViewProof(orderId: string) {
    if (!token) return;
    try {
      await openExcessPaymentProof(
        `/admin/orders/${orderId}/excess-payment-proof`,
        token,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open proof");
    }
  }

  async function handleMarkExcessPaid(orderId: string) {
    if (!token) return;
    setMarkingPaidId(orderId);
    try {
      await apiClient(token).post(`/admin/orders/${orderId}/mark-excess-paid`);
      toast.success("Excess marked as paid");
      await load();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not mark excess as paid",
      );
    } finally {
      setMarkingPaidId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Submitted</p>
          <p className="text-2xl font-semibold">{submittedCount}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total orders</p>
          <p className="text-2xl font-semibold">{orders.length}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Excess owed</p>
          <p className="text-2xl font-semibold">{formatNaira(excessTotal)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          nativeButton={false}
          render={<Link href={`/admin/weeks/${weekId}/place-order`} />}
        >
          <UserPlus className="size-4" />
          Place order
        </Button>
        <Button variant="outline" size="sm" onClick={() => void handleDownload("csv")}>
          Download CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => void handleDownload("pdf")}>
          Download PDF
        </Button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={excessOnly}
          onCheckedChange={(checked) => setExcessOnly(checked === true)}
          id="excess-only"
        />
        <Label htmlFor="excess-only">Show only orders with excess</Label>
      </label>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description="Orders will appear here once staff submit during the open window."
        />
      ) : (
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Covered</TableHead>
              <TableHead>Excess</TableHead>
              <TableHead>Acknowledged</TableHead>
              <TableHead>Payment proof</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  No orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.staffName}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.isCustomRecipient
                          ? "Custom recipient"
                          : order.staffEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {orderStatusLabel(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatNaira(order.totalCents)}</TableCell>
                  <TableCell>{formatNaira(order.companyCoveredCents)}</TableCell>
                  <TableCell>
                    {order.excessCents > 0 ? formatNaira(order.excessCents) : "—"}
                  </TableCell>
                  <TableCell>
                    {order.excessCents > 0
                      ? order.excessAcknowledged
                        ? "Yes"
                        : "No"
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {order.excessCents > 0 ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm">
                          {excessPaymentStatusLabel(order.excessPaymentStatus)}
                        </span>
                        {order.excessPaymentStatus === "PROOF_UPLOADED" ? (
                          <div className="flex flex-wrap gap-1">
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto justify-start p-0"
                              onClick={() => void handleViewProof(order.id)}
                            >
                              View proof
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto justify-start p-0"
                              disabled={markingPaidId === order.id}
                              onClick={() => void handleMarkExcessPaid(order.id)}
                            >
                              {markingPaidId === order.id
                                ? "Marking…"
                                : "Mark as paid"}
                            </Button>
                          </div>
                        ) : null}
                        {order.excessPaymentStatus === "PAID" ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto justify-start p-0"
                            onClick={() => void handleViewProof(order.id)}
                          >
                            View proof
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {order.status === "DRAFT" ||
                    (order.status === "SUBMITTED" && order.excessCents === 0) ? (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        nativeButton={false}
                        render={
                          <Link
                            href={`/admin/weeks/${weekId}/place-order/order?orderId=${order.id}`}
                          />
                        }
                      >
                        {order.status === "DRAFT" ? "Continue" : "Edit"}
                      </Button>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Reminder log</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Sent at</TableHead>
                <TableHead>Recipients</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No reminders sent yet.
                  </TableCell>
                </TableRow>
              ) : (
                reminders.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{reminderLabel(entry.type)}</TableCell>
                    <TableCell>
                      {new Date(entry.sentAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{entry.recipientCount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
