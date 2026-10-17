"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateTime } from "luxon";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { CalendarDays, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import type { MenuWeek } from "@/types/menu-week";
import type { DayOfWeek, Vendor } from "@/types/vendor";
import { DAY_LABELS } from "@/types/vendor";
import {
  DEFAULT_ORDERABLE_DAYS,
  OrderableDaysField,
} from "@/components/admin/orderable-days-field";
import { EmptyState } from "@/components/layout/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api-client";
import { formatNaira, parseNairaInput } from "@/lib/format";
import { menuWeekDisplayBadgeKey, menuWeekDisplayLabel } from "@/lib/labels";
import {
  DEFAULT_CHOPSPACE_TIMEZONE,
  defaultOrderWindowLocalInputs,
  localDateTimeToOffsetIso,
} from "@/lib/order-window";

const defaultWeekStart =
  DateTime.now().plus({ weeks: 1 }).startOf("week").toISODate() ?? "";
const defaultWindow = defaultOrderWindowLocalInputs(defaultWeekStart);

const createSchema = z
  .object({
    weekStart: z.string().min(1, "Week start is required"),
    activeVendorId: z.string().min(1, "Select a vendor"),
    maxBudgetNaira: z.string().min(1, "Budget is required"),
    maxOrderDaysPerStaff: z.number().int().min(1, "At least 1 day"),
    orderWindowOpensAt: z.string().min(1, "Opening time is required"),
    orderWindowClosesAt: z.string().min(1, "Closing time is required"),
    orderableDays: z
      .array(z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]))
      .min(1, "Select at least one orderable day"),
  })
  .refine(
    (data) => data.maxOrderDaysPerStaff <= data.orderableDays.length,
    {
      message: "Max order days cannot exceed orderable days",
      path: ["maxOrderDaysPerStaff"],
    },
  )
  .refine(
    (data) =>
      !data.orderWindowOpensAt ||
      !data.orderWindowClosesAt ||
      data.orderWindowClosesAt > data.orderWindowOpensAt,
    {
      message: "Closing time must be after opening time",
      path: ["orderWindowClosesAt"],
    },
  );

type CreateValues = z.infer<typeof createSchema>;

function statusBadgeVariant(week: MenuWeek): "default" | "secondary" | "outline" {
  const key = menuWeekDisplayBadgeKey(week);
  if (key === "OPEN") return "default";
  if (key === "UPCOMING") return "secondary";
  return "outline";
}

export function MenuWeeksManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [weeks, setWeeks] = useState<MenuWeek[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [closeWeekId, setCloseWeekId] = useState<string | null>(null);
  const [deleteWeek, setDeleteWeek] = useState<MenuWeek | null>(null);
  const [deletingWeek, setDeletingWeek] = useState(false);
  const [editWeek, setEditWeek] = useState<MenuWeek | null>(null);
  const [editOrderableDays, setEditOrderableDays] = useState<DayOfWeek[]>([]);
  const [editBudgetNaira, setEditBudgetNaira] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [timezone, setTimezone] = useState(DEFAULT_CHOPSPACE_TIMEZONE);

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      weekStart: defaultWeekStart,
      activeVendorId: "",
      maxBudgetNaira: "7200",
      maxOrderDaysPerStaff: 2,
      orderWindowOpensAt: defaultWindow.orderWindowOpensAt,
      orderWindowClosesAt: defaultWindow.orderWindowClosesAt,
      orderableDays: DEFAULT_ORDERABLE_DAYS,
    },
  });

  const weekStartValue = form.watch("weekStart");
  const previousWeekStart = useRef(weekStartValue);

  useEffect(() => {
    if (!weekStartValue || weekStartValue === previousWeekStart.current) return;
    previousWeekStart.current = weekStartValue;
    const next = defaultOrderWindowLocalInputs(weekStartValue, timezone);
    form.setValue("orderWindowOpensAt", next.orderWindowOpensAt);
    form.setValue("orderWindowClosesAt", next.orderWindowClosesAt);
  }, [weekStartValue, timezone, form]);

  const vendorSelectItems = useMemo(
    () => vendors.map((vendor) => ({ value: vendor.id, label: vendor.name })),
    [vendors],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [weeksRes, vendorsRes, workspaceRes] = await Promise.all([
        apiClient(token).get<{ menuWeeks: MenuWeek[] }>("/admin/menu-weeks"),
        apiClient(token).get<{ vendors: Vendor[] }>("/admin/vendors"),
        apiClient(token).get<{
          chopspace: { timezone?: string };
        }>("/admin/workspace"),
      ]);
      setWeeks(weeksRes.menuWeeks);
      const workspaceTimezone =
        workspaceRes.chopspace.timezone ??
        weeksRes.menuWeeks[0]?.timezone ??
        DEFAULT_CHOPSPACE_TIMEZONE;
      setTimezone(workspaceTimezone);
      setVendors(vendorsRes.vendors.filter((v) => v.isActive));
      if (vendorsRes.vendors[0] && !form.getValues("activeVendorId")) {
        form.setValue("activeVendorId", vendorsRes.vendors[0]!.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load menu weeks");
    } finally {
      setLoading(false);
    }
  }, [token, form]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(values: CreateValues) {
    if (!token) return;
    const maxOrderAmountCents = parseNairaInput(values.maxBudgetNaira);
    if (maxOrderAmountCents === null) {
      form.setError("maxBudgetNaira", { message: "Enter a valid budget" });
      return;
    }

    const orderWindowOpensAt = localDateTimeToOffsetIso(
      values.orderWindowOpensAt,
      timezone,
    );
    const orderWindowClosesAt = localDateTimeToOffsetIso(
      values.orderWindowClosesAt,
      timezone,
    );
    if (!orderWindowOpensAt || !orderWindowClosesAt) {
      form.setError("orderWindowOpensAt", { message: "Enter a valid date and time" });
      return;
    }

    setError(null);
    try {
      await apiClient(token).post("/admin/menu-weeks", {
        weekStart: values.weekStart,
        activeVendorId: values.activeVendorId,
        maxOrderAmountCents,
        maxOrderDaysPerStaff: values.maxOrderDaysPerStaff,
        orderableDays: values.orderableDays,
        orderWindowOpensAt,
        orderWindowClosesAt,
      });
      const nextWeekStart =
        DateTime.now().plus({ weeks: 2 }).startOf("week").toISODate() ?? "";
      const nextWindow = defaultOrderWindowLocalInputs(nextWeekStart, timezone);
      form.reset({
        weekStart: nextWeekStart,
        activeVendorId: values.activeVendorId,
        maxBudgetNaira: values.maxBudgetNaira,
        maxOrderDaysPerStaff: values.maxOrderDaysPerStaff,
        orderWindowOpensAt: nextWindow.orderWindowOpensAt,
        orderWindowClosesAt: nextWindow.orderWindowClosesAt,
        orderableDays: DEFAULT_ORDERABLE_DAYS,
      });
      toast.success("Menu week created");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create menu week";
      setError(message);
      toast.error(message);
    }
  }

  async function openWeek(id: string) {
    if (!token) return;
    setError(null);
    try {
      const result = await apiClient(token).patch<{
        openNotificationSent?: boolean;
        openNotificationError?: string;
      }>(`/admin/menu-weeks/${id}`, { status: "OPEN" });
      if (result.openNotificationError) {
        toast.warning(`Week opened, but email failed: ${result.openNotificationError}`);
      } else if (result.openNotificationSent) {
        toast.success("Week opened - staff notified by email");
      } else {
        toast.success("Week opened for ordering");
      }
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to open week";
      setError(message);
      toast.error(message);
    }
  }

  function startEditWeek(week: MenuWeek) {
    setEditWeek(week);
    setEditOrderableDays(week.orderableDays);
    setEditBudgetNaira(String(week.maxOrderAmountCents / 100));
  }

  async function saveEditWeek() {
    if (!token || !editWeek) return;
    if (editOrderableDays.length === 0) {
      toast.error("Select at least one orderable day");
      return;
    }
    const maxOrderAmountCents = parseNairaInput(editBudgetNaira);
    if (maxOrderAmountCents === null) {
      toast.error("Enter a valid budget");
      return;
    }

    setSavingEdit(true);
    setError(null);
    try {
      await apiClient(token).patch(`/admin/menu-weeks/${editWeek.id}`, {
        orderableDays: editOrderableDays,
        maxOrderAmountCents,
      });
      toast.success("Menu week updated");
      setEditWeek(null);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update menu week";
      setError(message);
      toast.error(message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function closeWeek(id: string) {
    if (!token) return;
    setError(null);
    try {
      await apiClient(token).patch(`/admin/menu-weeks/${id}`, { status: "CLOSED" });
      toast.success("Week closed");
      setCloseWeekId(null);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to close week";
      setError(message);
      toast.error(message);
    }
  }

  async function confirmDeleteWeek() {
    if (!token || !deleteWeek) return;
    setDeletingWeek(true);
    setError(null);
    try {
      await apiClient(token).delete(`/admin/menu-weeks/${deleteWeek.id}`);
      toast.success("Menu week deleted");
      setDeleteWeek(null);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete menu week";
      setError(message);
      toast.error(message);
    } finally {
      setDeletingWeek(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-xl border p-4 md:p-6">
        <h2 className="mb-4 text-lg font-semibold">Create menu week</h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="weekStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Week start (Monday)</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="activeVendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      items={vendorSelectItems}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxBudgetNaira"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget per day (₦)</FormLabel>
                    <FormControl>
                      <Input {...field} inputMode="decimal" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxOrderDaysPerStaff"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max order days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.valueAsNumber || 1)
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="orderWindowOpensAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordering opens</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" />
                    </FormControl>
                    <FormDescription>
                      Chopspace timezone ({timezone.replace(/_/g, " ")})
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orderWindowClosesAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordering closes</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" />
                    </FormControl>
                    <FormDescription>
                      Staff can order while the week is open and before this time
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="orderableDays"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <OrderableDaysField
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              variant="premium"
              size="lg"
              className="h-11 w-full rounded-lg sm:w-auto"
            >
              Create week
            </Button>
          </form>
        </Form>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : weeks.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No menu weeks yet"
          description="Create your first menu week to start accepting orders."
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Budget/day</TableHead>
                <TableHead>Max days</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeks.map((week) => (
                <TableRow key={week.id}>
                  <TableCell className="font-medium">
                    {DateTime.fromISO(week.weekStart)
                      .setZone(week.timezone)
                      .toFormat("d LLL yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(week)}>
                      {menuWeekDisplayLabel(week)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {DateTime.fromISO(week.orderWindowOpensAt)
                      .setZone(week.timezone)
                      .toFormat("ccc h:mm a")}
                    {" → "}
                    {DateTime.fromISO(week.orderWindowClosesAt)
                      .setZone(week.timezone)
                      .toFormat("ccc h:mm a")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {week.orderableDays.map((day) => (
                        <Badge key={day} variant="secondary" className="text-[10px]">
                          {DAY_LABELS[day].slice(0, 3)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{formatNaira(week.maxOrderAmountCents)}</TableCell>
                  <TableCell>{week.maxOrderDaysPerStaff ?? 2}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          render={
                            <Link href={`/admin/weeks/${week.id}/orders`}>
                              View orders
                            </Link>
                          }
                        />
                        {week.status === "DRAFT" ? (
                          <DropdownMenuItem onClick={() => startEditWeek(week)}>
                            Edit week
                          </DropdownMenuItem>
                        ) : null}
                        {week.status === "DRAFT" ? (
                          <DropdownMenuItem onClick={() => void openWeek(week.id)}>
                            Open early
                          </DropdownMenuItem>
                        ) : null}
                        {week.status === "OPEN" ? (
                          <DropdownMenuItem onClick={() => setCloseWeekId(week.id)}>
                            Close week
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteWeek(week)}
                        >
                          Delete week
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={editWeek !== null} onOpenChange={(open) => !open && setEditWeek(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit week</DialogTitle>
            <DialogDescription>
              {editWeek
                ? `Week of ${DateTime.fromISO(editWeek.weekStart).setZone(editWeek.timezone).toFormat("d LLL yyyy")}`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="edit-week-budget" className="text-sm font-medium">
              Budget per day (₦)
            </label>
            <Input
              id="edit-week-budget"
              inputMode="decimal"
              value={editBudgetNaira}
              onChange={(event) => setEditBudgetNaira(event.target.value)}
            />
          </div>
          <OrderableDaysField
            value={editOrderableDays}
            onChange={setEditOrderableDays}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditWeek(null)}>
              Cancel
            </Button>
            <Button
              variant="premium"
              onClick={() => void saveEditWeek()}
              disabled={savingEdit}
            >
              {savingEdit ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={closeWeekId !== null}
        onOpenChange={(open) => !open && setCloseWeekId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this menu week?</AlertDialogTitle>
            <AlertDialogDescription>
              Staff will no longer be able to submit orders for this week.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => closeWeekId && void closeWeek(closeWeekId)}
            >
              Close week
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteWeek !== null}
        onOpenChange={(open) => !open && !deletingWeek && setDeleteWeek(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the menu week
              {deleteWeek
                ? ` of ${DateTime.fromISO(deleteWeek.weekStart)
                    .setZone(deleteWeek.timezone)
                    .toFormat("d LLL yyyy")}`
                : ""}
              , including its orders, reviews, and reminder history. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingWeek}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletingWeek}
              onClick={() => void confirmDeleteWeek()}
            >
              {deletingWeek ? "Deleting…" : "Delete week"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
