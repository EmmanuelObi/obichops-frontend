"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { CalendarOff, CheckCircle2, Lock, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import type { CurrentMenuWeekResponse } from "@/types/menu-week";
import type { StaffOrder } from "@/types/order";
import type { DayOfWeek } from "@/types/vendor";
import { DAY_LABELS } from "@/types/vendor";
import { EmptyState } from "@/components/layout/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetBar } from "@/components/staff/budget-bar";
import { DayTabs } from "@/components/staff/day-tabs";
import { ExcessAcknowledgeModal } from "@/components/staff/excess-acknowledge-modal";
import { OrderingWindowBanner } from "@/components/staff/ordering-window-banner";
import { apiClient } from "@/lib/api-client";
import { formatNaira } from "@/lib/format";
import { calculateOrderTotals } from "@/lib/order-totals";
import { cn } from "@/lib/utils";

type CartLine = { menuItemId: string; dayOfWeek: DayOfWeek; quantity: number };

function OrderingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 flex-1 rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function StaffOrderingPage() {
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
  const [excessAcknowledged, setExcessAcknowledged] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const weekData = await apiClient(token).get<CurrentMenuWeekResponse>(
        "/menu-weeks/current",
      );
      setData(weekData);

      if (weekData.menuWeek) {
        const orderData = await apiClient(token).get<{ order: StaffOrder | null }>(
          `/orders/me?weekId=${weekData.menuWeek.id}`,
        );
        setOrder(orderData.order);
        if (orderData.order?.status !== "SUBMITTED") {
          setCart(
            orderData.order?.lineItems.map((item) => ({
              menuItemId: item.menuItemId,
              dayOfWeek: item.dayOfWeek,
              quantity: item.quantity,
            })) ?? [],
          );
        }
        if (weekData.menuWeek.orderableDays[0]) {
          setActiveDay(weekData.menuWeek.orderableDays[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ordering data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const menuWeek = data?.menuWeek;
  const isSubmitted = order?.status === "SUBMITTED";
  const canEdit = Boolean(menuWeek?.orderingAllowed && !isSubmitted);

  const menuForDay = useMemo(() => {
    if (!data?.menu) return [];
    return data.menu.filter((item) => item.dayOfWeek === activeDay);
  }, [data?.menu, activeDay]);

  const daysWithItems = useMemo(() => {
    const days = new Set<DayOfWeek>();
    for (const line of cart) {
      if (line.quantity > 0) days.add(line.dayOfWeek);
    }
    return Array.from(days);
  }, [cart]);

  const pricedCart = useMemo(() => {
    if (!data?.menu || !menuWeek) {
      return {
        totalCents: 0,
        companyCoveredCents: 0,
        excessCents: 0,
        orderDayCount: 0,
        budgetPoolCents: 0,
        isPooled: false,
        dayBreakdown: {} as Record<string, { totalCents: number }>,
      };
    }
    const priced = cart
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

    return calculateOrderTotals(priced, menuWeek.maxOrderAmountCents);
  }, [cart, data?.menu, menuWeek]);

  const maxOrderDays = menuWeek?.maxOrderDaysPerStaff ?? 2;

  const atOrderDayLimit = Boolean(
    menuWeek && daysWithItems.length >= maxOrderDays,
  );

  const cartSummary = useMemo(() => {
    if (!data?.menu) return [];
    return cart
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
  }, [cart, data?.menu]);

  function getQuantity(menuItemId: string) {
    return (
      cart.find(
        (line) => line.menuItemId === menuItemId && line.dayOfWeek === activeDay,
      )?.quantity ?? 0
    );
  }

  function updateQuantity(menuItemId: string, quantity: number) {
    if (!canEdit || !menuWeek) return;

    const isNewDay = !daysWithItems.includes(activeDay);
    if (
      quantity > 0 &&
      isNewDay &&
      daysWithItems.length >= maxOrderDays
    ) {
      toast.error(
        `You can only order on ${maxOrderDays} ${
          maxOrderDays === 1 ? "day" : "days"
        } this week`,
      );
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
      const result = await apiClient(token).put<{ order: StaffOrder }>("/orders/me", {
        menuWeekId: menuWeek.id,
        lineItems: cart,
      });
      setOrder(result.order);
      toast.success("Draft saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save order";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function submitOrder(acknowledgeExcess = false) {
    if (!token || !menuWeek || !canEdit) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient(token).put("/orders/me", {
        menuWeekId: menuWeek.id,
        lineItems: cart,
      });
      const result = await apiClient(token).post<{ order: StaffOrder }>(
        "/orders/me/submit",
        {
          menuWeekId: menuWeek.id,
          ...(acknowledgeExcess ? { excessAcknowledged: true } : {}),
        },
      );
      setOrder(result.order);
      setExcessModalOpen(false);
      setExcessAcknowledged(false);
      toast.success("Order submitted!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit order";
      if (message.includes("Excess acknowledgment")) {
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
    void submitOrder(false);
  }

  if (loading) {
    return <OrderingSkeleton />;
  }

  if (!menuWeek) {
    return (
      <EmptyState
        icon={CalendarOff}
        title="No menu week yet"
        description="Your admin hasn't published this week's menu. Check back on Friday when ordering usually opens."
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

      <OrderingWindowBanner menuWeek={menuWeek} />

      {data?.vendor ? (
        <p className="text-sm text-muted-foreground">
          This week&apos;s vendor:{" "}
          <span className="font-medium text-foreground">{data.vendor.name}</span>
        </p>
      ) : null}

      {isSubmitted ? (
        <Alert variant="success">
          <CheckCircle2 />
          <AlertDescription>
            Your order was submitted
            {order?.submittedAt
              ? ` on ${new Date(order.submittedAt).toLocaleString()}`
              : ""}
            . Total {formatNaira(order?.totalCents ?? 0)}.
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
      />

      <DayTabs
        orderableDays={menuWeek.orderableDays}
        activeDay={activeDay}
        onDayChange={setActiveDay}
        daysWithItems={daysWithItems}
        lockedDays={
          atOrderDayLimit
            ? menuWeek.orderableDays.filter((day) => !daysWithItems.includes(day))
            : []
        }
      />

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
                  isSubmitted && "opacity-75",
                )}
              >
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.name}</p>
                      <Badge variant="secondary">{formatNaira(item.priceCents)}</Badge>
                      {isSubmitted && qty > 0 ? (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="size-3" />
                          {qty} ordered
                        </Badge>
                      ) : null}
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
                        <Button
                          size="sm"
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={
                            atOrderDayLimit && !daysWithItems.includes(activeDay)
                          }
                        >
                          Add
                        </Button>
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
                  ) : !isSubmitted ? (
                    <Button size="sm" variant="outline" disabled>
                      Add
                    </Button>
                  ) : isSubmitted && qty > 0 ? (
                    <Lock className="size-4 text-muted-foreground" />
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
              <span>Your week ({cartSummary.length} items)</span>
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
            <div className="flex gap-2">
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
                {submitting ? "Submitting…" : "Submit order"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ExcessAcknowledgeModal
        open={excessModalOpen}
        excessCents={pricedCart.excessCents}
        totalCents={pricedCart.totalCents}
        budgetPoolCents={pricedCart.budgetPoolCents}
        isPooled={pricedCart.isPooled}
        orderDayCount={pricedCart.orderDayCount}
        maxOrderAmountCents={menuWeek.maxOrderAmountCents}
        acknowledged={excessAcknowledged}
        onAcknowledgedChange={setExcessAcknowledged}
        onCancel={() => {
          setExcessModalOpen(false);
          setExcessAcknowledged(false);
        }}
        onConfirm={() => void submitOrder(true)}
        submitting={submitting}
      />
    </div>
  );
}
