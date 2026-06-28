"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { CalendarOff, CheckCircle2, Minus, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { AdminProxyExcessModal } from "@/components/admin/admin-proxy-excess-modal";
import { BudgetBar } from "@/components/staff/budget-bar";
import { DayTabs } from "@/components/staff/day-tabs";
import { OrderingWindowBanner } from "@/components/staff/ordering-window-banner";
import { EmptyState } from "@/components/layout/empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { formatNaira } from "@/lib/format";
import { orderDayLimitMessage } from "@/lib/order-day-limit";
import { calculateOrderTotals } from "@/lib/order-totals";
import { computePackSummary, filterFoodCartLines } from "@/lib/pack-lines";
import { cn } from "@/lib/utils";
import type { CurrentMenuWeekResponse } from "@/types/menu-week";
import type { StaffOrder } from "@/types/order";
import type {
  ProxyOrderRecipient,
} from "@/types/proxy-order";
import { toProxyOrderRecipientPayload } from "@/types/proxy-order";
import type { DayOfWeek } from "@/types/vendor";
import { DAY_LABELS } from "@/types/vendor";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type CartLine = { menuItemId: string; dayOfWeek: DayOfWeek; quantity: number };

function lineItemsToCart(
  items: StaffOrder["lineItems"],
  packItemIds: Set<string>,
): CartLine[] {
  return filterFoodCartLines(
    items.map(({ menuItemId, dayOfWeek, quantity }) => ({
      menuItemId,
      dayOfWeek,
      quantity,
    })),
    packItemIds,
  );
}

interface AdminProxyOrderingPageProps {
  weekId: string;
  recipient: ProxyOrderRecipient;
}

export function AdminProxyOrderingPage({
  weekId,
  recipient,
}: AdminProxyOrderingPageProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [data, setData] = useState<CurrentMenuWeekResponse | null>(null);
  const [order, setOrder] = useState<StaffOrder | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [activeDay, setActiveDay] = useState<DayOfWeek>("MON");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [excessModalOpen, setExcessModalOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [context, orderQuery] = await Promise.all([
        apiClient(token).get<CurrentMenuWeekResponse>(
          `/admin/menu-weeks/${weekId}/ordering-context`,
        ),
        recipient.recipientType === "STAFF"
          ? apiClient(token).get<{
              order: StaffOrder | null;
              recipient: ProxyOrderRecipient;
            }>(
              `/admin/menu-weeks/${weekId}/proxy-order?userId=${recipient.userId}`,
            )
          : apiClient(token).get<{
              order: StaffOrder | null;
              recipient: ProxyOrderRecipient;
            }>(
              `/admin/menu-weeks/${weekId}/proxy-order?placedForName=${encodeURIComponent(recipient.placedForName)}`,
            ),
      ]);

      setData(context);
      setOrder(orderQuery.order);
      setIsEditing(false);

      const packIds = new Set((context.packMenu ?? []).map((p) => p.id));
      setCart(lineItemsToCart(orderQuery.order?.lineItems ?? [], packIds));

      if (context.menuWeek?.orderableDays[0]) {
        setActiveDay(context.menuWeek.orderableDays[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ordering data");
    } finally {
      setLoading(false);
    }
  }, [token, weekId, recipient]);

  useEffect(() => {
    void load();
  }, [load]);

  const menuWeek = data?.menuWeek;
  const isSubmitted = order?.status === "SUBMITTED";
  const canEditSubmitted =
    isSubmitted &&
    Boolean(menuWeek?.orderingAllowed) &&
    (order?.excessCents ?? 0) === 0;
  const canEdit = Boolean(
    menuWeek?.orderingAllowed && (!isSubmitted || isEditing),
  );

  const packItemIds = useMemo(
    () => new Set((data?.packMenu ?? []).map((item) => item.id)),
    [data?.packMenu],
  );

  const menuForDay = useMemo(() => {
    if (!data?.menu) return [];
    return data.menu.filter((item) => item.dayOfWeek === activeDay);
  }, [data?.menu, activeDay]);

  const activeFoodLines = useMemo(() => {
    const raw =
      isSubmitted && !isEditing && order
        ? order.lineItems.map(({ menuItemId, dayOfWeek, quantity }) => ({
            menuItemId,
            dayOfWeek,
            quantity,
          }))
        : cart;
    return filterFoodCartLines(raw, packItemIds);
  }, [cart, order, isSubmitted, isEditing, packItemIds]);

  const daysWithItems = useMemo(() => {
    const days = new Set<DayOfWeek>();
    for (const line of activeFoodLines) {
      if (line.quantity > 0) days.add(line.dayOfWeek);
    }
    return Array.from(days);
  }, [activeFoodLines]);

  const pricedCart = useMemo(() => {
    if (!data?.menu || !menuWeek) {
      return {
        totalCents: 0,
        companyCoveredCents: 0,
        excessCents: 0,
        orderDayCount: 0,
        budgetPoolCents: 0,
        isPooled: false,
        totalPacks: 0,
        totalPackCents: 0,
      };
    }

    if (isSubmitted && !isEditing && order) {
      const packLines = order.lineItems.filter((line) =>
        packItemIds.has(line.menuItemId),
      );
      const totalPacks = packLines.reduce((sum, line) => sum + line.quantity, 0);
      const totalPackCents = packLines.reduce(
        (sum, line) =>
          sum + line.quantity * (line.unitPriceCentsSnapshot ?? 0),
        0,
      );
      const orderDayCount = daysWithItems.length;
      const budgetPoolCents =
        orderDayCount > 1
          ? orderDayCount * menuWeek.maxOrderAmountCents
          : menuWeek.maxOrderAmountCents;

      return {
        totalCents: order.totalCents,
        companyCoveredCents: order.companyCoveredCents,
        excessCents: order.excessCents,
        orderDayCount,
        budgetPoolCents,
        isPooled: orderDayCount > 1,
        totalPacks,
        totalPackCents,
      };
    }

    const priced = activeFoodLines
      .map((line) => {
        const item = data.menu.find((m) => m.id === line.menuItemId);
        if (!item) return null;
        return {
          dayOfWeek: line.dayOfWeek,
          unitPriceCents: item.priceCents,
          quantity: line.quantity,
        };
      })
      .filter(
        (x): x is { dayOfWeek: DayOfWeek; unitPriceCents: number; quantity: number } =>
          x !== null,
      );

    const packSummary = computePackSummary(
      activeFoodLines,
      data.menu.map((item) => ({
        id: item.id,
        dayOfWeek: item.dayOfWeek,
        packsRequired: item.packsRequired ?? 0,
      })),
      data.packMenu ?? [],
    );

    const allLines = [
      ...priced,
      ...packSummary.packLines.map((line) => ({
        dayOfWeek: line.dayOfWeek,
        unitPriceCents: line.unitPriceCents,
        quantity: line.quantity,
      })),
    ];

    const totals = calculateOrderTotals(allLines, menuWeek.maxOrderAmountCents);

    return {
      ...totals,
      totalPacks: packSummary.totalPacks,
      totalPackCents: packSummary.totalPackCents,
    };
  }, [
    activeFoodLines,
    data?.menu,
    data?.packMenu,
    daysWithItems.length,
    isEditing,
    isSubmitted,
    menuWeek,
    order,
    packItemIds,
  ]);

  const maxOrderDays = menuWeek?.maxOrderDaysPerStaff ?? 2;
  const atOrderDayLimit = Boolean(
    menuWeek && daysWithItems.length >= maxOrderDays,
  );

  const cartSummary = useMemo(() => {
    if (!data?.menu) return [];
    return activeFoodLines
      .filter((line) => line.quantity > 0)
      .map((line) => {
        const item = data.menu.find((m) => m.id === line.menuItemId);
        if (!item) return null;
        return {
          ...line,
          name: item.name,
          priceCents: item.priceCents,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [activeFoodLines, data?.menu]);

  function getQuantity(menuItemId: string) {
    if (packItemIds.has(menuItemId)) return 0;
    if (isSubmitted && !isEditing && order) {
      return (
        order.lineItems.find(
          (line) =>
            line.menuItemId === menuItemId &&
            line.dayOfWeek === activeDay &&
            !packItemIds.has(line.menuItemId),
        )?.quantity ?? 0
      );
    }
    return (
      cart.find(
        (line) => line.menuItemId === menuItemId && line.dayOfWeek === activeDay,
      )?.quantity ?? 0
    );
  }

  function startEditing() {
    if (!order) return;
    setCart(lineItemsToCart(order.lineItems, packItemIds));
    setIsEditing(true);
  }

  function cancelEditing() {
    if (!order) return;
    setCart(lineItemsToCart(order.lineItems, packItemIds));
    setIsEditing(false);
  }

  function updateQuantity(menuItemId: string, quantity: number) {
    if (!canEdit || !menuWeek) return;

    const isNewDay = !daysWithItems.includes(activeDay);
    if (quantity > 0 && isNewDay && daysWithItems.length >= maxOrderDays) {
      toast.error(orderDayLimitMessage(maxOrderDays, "add"));
      return;
    }

    setCart((prev) => {
      const rest = prev.filter(
        (line) =>
          !(line.menuItemId === menuItemId && line.dayOfWeek === activeDay),
      );
      if (quantity <= 0) return rest;
      return [...rest, { menuItemId, dayOfWeek: activeDay, quantity }];
    });
  }

  async function saveDraft() {
    if (!token || !menuWeek || !canEdit) return;
    setSaving(true);
    setError(null);
    try {
      const result = await apiClient(token).put<{ order: StaffOrder }>(
        `/admin/menu-weeks/${weekId}/proxy-order`,
        {
          recipient: toProxyOrderRecipientPayload(recipient),
          lineItems: cart,
        },
      );
      setOrder(result.order);
      setIsEditing(false);
      toast.success("Draft saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save order";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function submitOrder() {
    if (!token || !menuWeek || !canEdit) return;
    setSubmitting(true);
    setError(null);
    try {
      const saved = await apiClient(token).put<{ order: StaffOrder }>(
        `/admin/menu-weeks/${weekId}/proxy-order`,
        {
          recipient: toProxyOrderRecipientPayload(recipient),
          lineItems: cart,
        },
      );
      const result = await apiClient(token).post<{ order: StaffOrder }>(
        `/admin/menu-weeks/${weekId}/proxy-order/submit`,
        { orderId: saved.order.id },
      );
      setOrder(result.order);
      setExcessModalOpen(false);
      setIsEditing(false);
      toast.success(
        isSubmitted && isEditing ? "Order updated!" : "Order submitted!",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit order";
      if (message.includes("Payment proof required")) {
        setExcessModalOpen(true);
      } else {
        setError(message);
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmitClick() {
    if (pricedCart.excessCents > 0) {
      setExcessModalOpen(true);
      return;
    }
    void submitOrder();
  }

  const isActiveDayLocked =
    atOrderDayLimit && !daysWithItems.includes(activeDay);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!menuWeek) {
    return (
      <EmptyState
        icon={CalendarOff}
        title="Menu week not found"
        description="This menu week could not be loaded."
      />
    );
  }

  return (
    <div className={cn("animate-fade-in space-y-6", canEdit && "pb-28")}>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Placing order for</p>
          <p className="text-lg font-semibold">{recipient.displayName}</p>
          {recipient.recipientType === "CUSTOM" ? (
            <Badge variant="outline" className="mt-1">
              Custom recipient
            </Badge>
          ) : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`/admin/weeks/${weekId}/orders`} />}
        >
          Back to orders
        </Button>
      </div>

      <OrderingWindowBanner menuWeek={menuWeek} />

      {data?.vendor ? (
        <p className="text-sm text-muted-foreground">
          Vendor:{" "}
          <span className="font-medium text-foreground">{data.vendor.name}</span>
        </p>
      ) : null}

      {isSubmitted && isEditing ? (
        <Alert variant="warning">
          <Pencil />
          <AlertTitle>Editing order</AlertTitle>
          <AlertDescription>
            Save or update when done. Cancel to keep the submitted order unchanged.
          </AlertDescription>
        </Alert>
      ) : isSubmitted ? (
        <Alert variant="success">
          <CheckCircle2 />
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Order submitted
              {order?.submittedAt
                ? ` on ${new Date(order.submittedAt).toLocaleString()}`
                : ""}
              . Total {formatNaira(order?.totalCents ?? 0)}.
              {(order?.excessCents ?? 0) > 0 ? (
                <span className="mt-1 block text-sm">
                  Orders with excess payment can&apos;t be changed after submission.
                </span>
              ) : null}
            </span>
            {canEditSubmitted ? (
              <Button size="sm" variant="secondary" onClick={startEditing}>
                Edit order
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <BudgetBar
        totalCents={pricedCart.totalCents}
        companyCoveredCents={pricedCart.companyCoveredCents}
        maxOrderAmountCents={menuWeek.maxOrderAmountCents}
        excessCents={pricedCart.excessCents}
        orderDayCount={pricedCart.orderDayCount}
        budgetPoolCents={pricedCart.budgetPoolCents}
        isPooled={pricedCart.isPooled}
        maxOrderDaysPerStaff={menuWeek.maxOrderDaysPerStaff ?? 2}
        totalPacks={pricedCart.totalPacks}
        totalPackCents={pricedCart.totalPackCents}
      />

      <DayTabs
        orderableDays={menuWeek.orderableDays}
        activeDay={activeDay}
        onDayChange={setActiveDay}
        daysWithItems={daysWithItems}
        maxOrderDays={maxOrderDays}
        lockedDays={
          atOrderDayLimit
            ? menuWeek.orderableDays.filter((day) => !daysWithItems.includes(day))
            : []
        }
      />

      {isActiveDayLocked ? (
        <p className="text-sm text-muted-foreground">
          {orderDayLimitMessage(maxOrderDays, "inline")}
        </p>
      ) : null}

      <div key={activeDay} className="stagger-children space-y-3">
        {menuForDay.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title="Nothing on the menu"
            description={`No items available for ${DAY_LABELS[activeDay]}.`}
            className="py-8"
          />
        ) : (
          menuForDay.map((item) => {
            const qty = getQuantity(item.id);
            return (
              <Card
                key={item.id}
                className={cn(
                  "overflow-hidden transition-opacity",
                  isSubmitted && !isEditing && "opacity-75",
                )}
              >
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.name}</p>
                      <Badge variant="secondary">{formatNaira(item.priceCents)}</Badge>
                    </div>
                    {item.description ? (
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  {canEdit ? (
                    <div className="flex items-center gap-2">
                      {qty === 0 ? (
                        isActiveDayLocked ? (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <span className="inline-flex cursor-not-allowed">
                                  <Button size="sm" disabled>
                                    Add
                                  </Button>
                                </span>
                              }
                            />
                            <TooltipContent side="top" className="max-w-xs">
                              {orderDayLimitMessage(maxOrderDays, "add")}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            Add
                          </Button>
                        )
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => updateQuantity(item.id, qty - 1)}
                          >
                            <Minus />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {qty}
                          </span>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => updateQuantity(item.id, qty + 1)}
                          >
                            <Plus />
                          </Button>
                        </>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {cartSummary.length > 0 ? (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => setCartOpen((open) => !open)}
          >
            <CardTitle className="flex items-center justify-between text-base">
              <span>Order summary ({cartSummary.length} items)</span>
              <span className="text-sm font-normal text-muted-foreground">
                {cartOpen ? "Hide" : "Show"}
              </span>
            </CardTitle>
          </CardHeader>
          {cartOpen ? (
            <CardContent className="space-y-2 pt-0">
              {cartSummary.map((line) => (
                <div
                  key={`${line.menuItemId}-${line.dayOfWeek}`}
                  className="flex justify-between text-sm"
                >
                  <span>
                    {DAY_LABELS[line.dayOfWeek]} · {line.name} × {line.quantity}
                  </span>
                  <span className="text-muted-foreground">
                    {formatNaira(line.priceCents * line.quantity)}
                  </span>
                </div>
              ))}
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      {canEdit ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-background/90">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">
                {formatNaira(pricedCart.totalCents)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isSubmitted && isEditing ? (
                <Button
                  variant="outline"
                  onClick={cancelEditing}
                  disabled={submitting || saving}
                >
                  Cancel editing
                </Button>
              ) : null}
              <Button
                variant="secondary"
                onClick={() => void saveDraft()}
                disabled={saving || cart.length === 0}
              >
                {saving ? "Saving…" : "Save draft"}
              </Button>
              <Button
                variant="premium"
                size="lg"
                className="h-11 rounded-lg"
                onClick={handleSubmitClick}
                disabled={submitting || cart.length === 0}
              >
                {submitting
                  ? isSubmitted && isEditing
                    ? "Updating…"
                    : "Submitting…"
                  : isSubmitted && isEditing
                    ? "Update order"
                    : "Submit order"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminProxyExcessModal
        open={excessModalOpen}
        weekId={weekId}
        recipient={recipient}
        excessCents={pricedCart.excessCents}
        totalCents={pricedCart.totalCents}
        budgetPoolCents={pricedCart.budgetPoolCents}
        isPooled={pricedCart.isPooled}
        orderDayCount={pricedCart.orderDayCount}
        maxOrderAmountCents={menuWeek.maxOrderAmountCents}
        cart={cart}
        vendor={data?.vendor ?? null}
        token={token}
        onCancel={() => setExcessModalOpen(false)}
        onConfirm={() => void submitOrder()}
        onOrderUpdated={setOrder}
        submitting={submitting}
      />
    </div>
  );
}
