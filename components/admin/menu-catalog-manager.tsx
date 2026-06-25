"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSession } from "next-auth/react";

import {
  DAY_LABELS,
  DAYS_OF_WEEK,
  type DayOfWeek,
  type MenuItem,
} from "@/types/vendor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { formatNaira, parseNairaInput } from "@/lib/format";

const addSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  priceNaira: z.string().min(1, "Price is required"),
});

const editSchema = addSchema;

type AddValues = z.infer<typeof addSchema>;

interface MenuCatalogManagerProps {
  vendorId: string;
  vendorName: string;
}

export function MenuCatalogManager({
  vendorId,
  vendorName,
}: MenuCatalogManagerProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeDay, setActiveDay] = useState<DayOfWeek>("MON");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const addForm = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { name: "", description: "", priceNaira: "" },
  });

  const editForm = useForm<AddValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: "", description: "", priceNaira: "" },
  });

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient(token).get<{ menuItems: MenuItem[] }>(
        `/admin/vendors/${vendorId}/menu-items`,
      );
      setItems(data.menuItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, [token, vendorId]);

  useEffect(() => {
    void load();
  }, [load]);

  const itemsByDay = useMemo(() => {
    const map = Object.fromEntries(
      DAYS_OF_WEEK.map((day) => [day, [] as MenuItem[]]),
    ) as Record<DayOfWeek, MenuItem[]>;

    for (const item of items) {
      map[item.dayOfWeek]?.push(item);
    }

    return map;
  }, [items]);

  async function onAdd(values: AddValues) {
    if (!token) return;
    const priceCents = parseNairaInput(values.priceNaira);
    if (priceCents === null) {
      addForm.setError("priceNaira", { message: "Enter a valid price" });
      return;
    }

    setError(null);
    try {
      await apiClient(token).post(`/admin/vendors/${vendorId}/menu-items`, {
        dayOfWeek: activeDay,
        name: values.name.trim(),
        description: values.description?.trim() ?? "",
        priceCents,
      });
      addForm.reset({ name: "", description: "", priceNaira: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add menu item");
    }
  }

  function openEdit(item: MenuItem) {
    setEditingItem(item);
    editForm.reset({
      name: item.name,
      description: item.description,
      priceNaira: String(item.priceCents / 100),
    });
  }

  async function onEdit(values: AddValues) {
    if (!token || !editingItem) return;
    const priceCents = parseNairaInput(values.priceNaira);
    if (priceCents === null) {
      editForm.setError("priceNaira", { message: "Enter a valid price" });
      return;
    }

    setError(null);
    try {
      await apiClient(token).patch(`/admin/menu-items/${editingItem.id}`, {
        name: values.name.trim(),
        description: values.description?.trim() ?? "",
        priceCents,
      });
      setEditingItem(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update menu item");
    }
  }

  async function toggleAvailability(item: MenuItem, enabled: boolean) {
    if (!token) return;
    setTogglingId(item.id);
    setError(null);
    try {
      await apiClient(token).patch(`/admin/menu-items/${item.id}`, {
        isAvailable: enabled,
      });
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update menu item availability",
      );
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <p className="text-sm text-muted-foreground">
        Persistent catalog for{" "}
        <span className="font-medium text-foreground">{vendorName}</span>. Use the
        toggle on each item to enable or disable it for that day — disabled items
        are hidden from staff when ordering.
      </p>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs value={activeDay} onValueChange={(v) => setActiveDay(v as DayOfWeek)}>
        <TabsList className="flex h-auto flex-wrap">
          {DAYS_OF_WEEK.map((day) => (
            <TabsTrigger key={day} value={day}>
              {DAY_LABELS[day]}
            </TabsTrigger>
          ))}
        </TabsList>

        {DAYS_OF_WEEK.map((day) => (
          <TabsContent key={day} value={day} className="space-y-6">
            <Form {...addForm}>
              <form
                onSubmit={addForm.handleSubmit(onAdd)}
                className="grid gap-4 rounded-lg border p-4 md:grid-cols-4"
              >
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Jollof Rice & Chicken" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Optional details" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="priceNaira"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₦)</FormLabel>
                      <FormControl>
                        <Input {...field} inputMode="decimal" placeholder="2500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <Button
                    type="submit"
                    variant="premium"
                    size="lg"
                    className="h-11 w-full rounded-lg md:w-auto"
                  >
                    Add to {DAY_LABELS[day]}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              ) : itemsByDay[day].length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No items for {DAY_LABELS[day]} yet.
                </p>
              ) : (
                <div className="stagger-children space-y-3">
                {itemsByDay[day].map((item) => (
                  <div
                    key={item.id}
                    className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
                      item.isAvailable ? "" : "opacity-60"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{item.name}</p>
                        <Badge variant={item.isAvailable ? "default" : "secondary"}>
                          {item.isAvailable ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      {item.description ? (
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                      <p className="text-sm font-medium">
                        {formatNaira(item.priceCents)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={item.isAvailable}
                          disabled={togglingId === item.id}
                          onCheckedChange={(checked) =>
                            void toggleAvailability(item, checked === true)
                          }
                          id={`item-${item.id}-enabled`}
                        />
                        <span className="text-muted-foreground">
                          {item.isAvailable ? "Enabled" : "Disabled"}
                        </span>
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(item)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit menu item</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="priceNaira"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₦)</FormLabel>
                    <FormControl>
                      <Input {...field} inputMode="decimal" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" variant="premium" size="lg" className="h-11 rounded-lg">
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
