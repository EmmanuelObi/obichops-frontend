"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { DateTime } from "luxon";
import { Building2, Eye } from "lucide-react";
import { toast } from "sonner";

import type { PlatformWorkspace } from "@/types/platform";
import { ManageWorkspaceButton } from "@/components/platform/manage-workspace-button";
import { WorkspaceStatusActions } from "@/components/platform/workspace-status-actions";
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
import { menuWeekStatusLabel } from "@/lib/labels";

const createSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens"),
});

type CreateValues = z.input<typeof createSchema>;

function formatLastActivity(value: string | null): string {
  if (!value) return "—";
  return DateTime.fromISO(value).toFormat("d LLL yyyy");
}

export function WorkspacesManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [workspaces, setWorkspaces] = useState<PlatformWorkspace[]>([]);
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
      const data = await apiClient(token).get<{ workspaces: PlatformWorkspace[] }>(
        "/platform/workspaces",
      );
      setWorkspaces(data.workspaces);
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
              <TableHead>Workspace</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Vendors</TableHead>
              <TableHead>Week</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Last activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {workspaces.map((workspace) => (
                <TableRow key={workspace.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{workspace.name}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {workspace.slug}
                        </span>
                        <Badge variant={workspace.isActive ? "default" : "secondary"}>
                          {workspace.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{workspace.stats.activeTeamCount}</TableCell>
                  <TableCell>{workspace.stats.vendorCount}</TableCell>
                  <TableCell>
                    {workspace.stats.currentMenuWeekStatus
                      ? menuWeekStatusLabel(workspace.stats.currentMenuWeekStatus)
                      : "—"}
                  </TableCell>
                  <TableCell>{workspace.stats.submittedOrdersCount}</TableCell>
                  <TableCell>
                    {formatLastActivity(workspace.stats.lastActivityAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <WorkspaceStatusActions
                        workspace={workspace}
                        onUpdated={load}
                      />
                      <ManageWorkspaceButton workspace={workspace} />
                      <Link
                        href={`/platform/workspaces/${workspace.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        <Eye className="size-4" />
                        View
                      </Link>
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
