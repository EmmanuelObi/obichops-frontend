"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { Store } from "lucide-react";
import { toast } from "sonner";

import type { Vendor } from "@/types/vendor";
import { EmptyState } from "@/components/layout/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
});

type CreateValues = z.infer<typeof createSchema>;

export function VendorsManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", email: "" },
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

  async function onSubmit(values: CreateValues) {
    if (!token) return;
    setError(null);
    try {
      await apiClient(token).post("/admin/vendors", values);
      form.reset({ name: "", email: "" });
      toast.success("Vendor added");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vendor");
    }
  }

  async function deactivateVendor(id: string) {
    if (!token) return;
    setError(null);
    try {
      await apiClient(token).delete(`/admin/vendors/${id}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate vendor");
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
            className="grid gap-4 md:grid-cols-3"
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
          <div className="flex items-end">
            <Button
              type="submit"
              variant="premium"
              size="lg"
              className="h-11 w-full rounded-lg md:w-auto"
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>
                    <Badge variant={vendor.isActive ? "default" : "secondary"}>
                      {vendor.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  );
}
