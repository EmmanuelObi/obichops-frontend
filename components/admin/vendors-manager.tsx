"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { DateTime } from "luxon";
import { MessageSquare, Pencil, Star, Store } from "lucide-react";
import { toast } from "sonner";

import type { Vendor, VendorReview } from "@/types/vendor";
import { EmptyState } from "@/components/layout/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api-client";
import { formatVendorRating } from "@/lib/labels";

const bankFieldsSchema = {
  accountName: z.string().min(1, "Account name is required"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
};

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  ...bankFieldsSchema,
});

const editSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  ...bankFieldsSchema,
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

function maskAccountNumber(accountNumber: string | null): string {
  if (!accountNumber) return "—";
  if (accountNumber.length <= 4) return accountNumber;
  return `•••• ${accountNumber.slice(-4)}`;
}

export function VendorsManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [reviewsVendor, setReviewsVendor] = useState<Vendor | null>(null);
  const [reviews, setReviews] = useState<VendorReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const sortedVendors = useMemo(() => {
    return [...vendors].sort((a, b) => {
      const aRating = a.averageRating ?? -1;
      const bRating = b.averageRating ?? -1;
      if (bRating !== aRating) return bRating - aRating;
      return a.name.localeCompare(b.name);
    });
  }, [vendors]);

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: "",
      email: "",
      accountName: "",
      bankName: "",
      accountNumber: "",
    },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: "",
      email: "",
      accountName: "",
      bankName: "",
      accountNumber: "",
    },
  });

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient(token).get<{ vendors: Vendor[] }>(
        "/admin/vendors",
      );
      setVendors(data.vendors);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const openReviews = useCallback(
    async (vendor: Vendor) => {
      if (!token) return;
      setReviewsVendor(vendor);
      setReviewsLoading(true);
      setReviews([]);
      try {
        const data = await apiClient(token).get<{ reviews: VendorReview[] }>(
          `/admin/vendors/${vendor.id}/reviews`,
        );
        setReviews(data.reviews);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load reviews");
        setReviewsVendor(null);
      } finally {
        setReviewsLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!editingVendor) return;
    editForm.reset({
      name: editingVendor.name,
      email: editingVendor.email,
      accountName: editingVendor.accountName ?? "",
      bankName: editingVendor.bankName ?? "",
      accountNumber: editingVendor.accountNumber ?? "",
    });
  }, [editingVendor, editForm]);

  async function onSubmit(values: CreateValues) {
    if (!token) return;
    setError(null);
    try {
      await apiClient(token).post("/admin/vendors", values);
      form.reset({
        name: "",
        email: "",
        accountName: "",
        bankName: "",
        accountNumber: "",
      });
      toast.success("Vendor added");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vendor");
    }
  }

  async function onEditSubmit(values: EditValues) {
    if (!token || !editingVendor) return;
    setSavingEdit(true);
    setError(null);
    try {
      await apiClient(token).patch(`/admin/vendors/${editingVendor.id}`, values);
      toast.success("Vendor updated");
      setEditingVendor(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update vendor");
    } finally {
      setSavingEdit(false);
    }
  }

  async function deactivateVendor(id: string) {
    if (!token) return;
    setError(null);
    try {
      await apiClient(token).delete(`/admin/vendors/${id}`);
      toast.success("Vendor deactivated");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate vendor");
    }
  }

  async function activateVendor(id: string) {
    if (!token) return;
    setError(null);
    try {
      await apiClient(token).patch(`/admin/vendors/${id}`, { isActive: true });
      toast.success("Vendor activated");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate vendor");
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
        <h2 className="mb-4 text-lg font-semibold">Add vendor</h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Mama Put Kitchen" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="orders@vendor.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Mama Put Kitchen Ltd" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="GTBank" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="0123456789" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end sm:col-span-2 lg:col-span-3">
              <Button
                type="submit"
                variant="premium"
                size="lg"
                className="h-11 w-full rounded-lg sm:w-auto"
              >
                Add vendor
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No vendors yet"
          description="Add your first food vendor to build a weekly menu."
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedVendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>
                    {vendor.reviewCount ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm hover:text-primary"
                        onClick={() => void openReviews(vendor)}
                      >
                        <Star className="size-3.5 fill-gold text-gold" />
                        {formatVendorRating(vendor.averageRating, vendor.reviewCount)}
                      </button>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{vendor.bankName ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {maskAccountNumber(vendor.accountNumber)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={vendor.isActive ? "default" : "secondary"}>
                      {vendor.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {(vendor.reviewCount ?? 0) > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void openReviews(vendor)}
                        >
                          <MessageSquare className="size-4" />
                          Reviews
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingVendor(vendor)}
                      >
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                      <Link
                        href={`/admin/vendors/${vendor.id}/menu`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Manage menu
                      </Link>
                      {vendor.isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void deactivateVendor(vendor.id)}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void activateVendor(vendor.id)}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={Boolean(editingVendor)}
        onOpenChange={(open) => !open && setEditingVendor(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit vendor</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account number</FormLabel>
                    <FormControl>
                      <Input {...field} className="font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingVendor(null)}
                  disabled={savingEdit}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingEdit}>
                  {savingEdit ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(reviewsVendor)}
        onOpenChange={(open) => !open && setReviewsVendor(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Reviews for {reviewsVendor?.name}
            </DialogTitle>
          </DialogHeader>
          {reviewsLoading ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No staff reviews yet for this vendor.
            </p>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border bg-muted/20 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">{review.staffName}</p>
                      <p className="text-xs text-muted-foreground">
                        {review.weekStart
                          ? `Week of ${DateTime.fromISO(review.weekStart).toFormat("d LLL yyyy")}`
                          : "Unknown week"}
                        {" · "}
                        {DateTime.fromISO(review.createdAt).toFormat(
                          "d LLL yyyy",
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-gold">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className="size-4"
                          fill={index < review.rating ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
