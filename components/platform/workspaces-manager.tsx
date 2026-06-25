"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

import type { Workspace } from "@/types/auth";
import { EmptyState } from "@/components/layout/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  name: z.string().min(2, "Name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens"),
});

type CreateValues = z.input<typeof createSchema>;

export function WorkspacesManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", slug: "" },
  });

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient(token).get<{
        workspaces: Array<{
          id: string;
          name: string;
          slug: string;
          isActive: boolean;
          createdAt?: string;
        }>;
      }>("/platform/workspaces");
      setWorkspaces(
        data.workspaces.map((workspace) => ({
          _id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          isActive: workspace.isActive,
          createdAt: workspace.createdAt,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces");
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
      await apiClient(token).post("/platform/workspaces", values);
      form.reset();
      toast.success("Workspace created");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
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
        <h2 className="mb-4 text-lg font-semibold">Create workspace</h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 md:grid-cols-2"
          >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workspace name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Obi's Chops Downtown" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="obis-downtown"
                    onChange={(event) =>
                      field.onChange(event.target.value.toLowerCase())
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="md:col-span-2">
            <Button type="submit" variant="premium" size="lg" className="h-11 rounded-lg">
              Create workspace
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
      ) : workspaces.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No workspaces yet"
          description="Create your first customer workspace to get started."
        />
      ) : (
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {workspaces.map((workspace) => (
                <TableRow key={workspace._id}>
                  <TableCell className="font-medium">{workspace.name}</TableCell>
                  <TableCell>{workspace.slug}</TableCell>
                  <TableCell>
                    <Badge variant={workspace.isActive ? "default" : "secondary"}>
                      {workspace.isActive ? "Active" : "Inactive"}
                    </Badge>
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
