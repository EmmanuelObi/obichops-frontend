"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import type { AllowedEmail } from "@/types/auth";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
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
import { isEmailDomainAllowed, formatAllowedDomains } from "@/lib/email-domain";
import { roleLabel } from "@/lib/labels";
import { useSession } from "next-auth/react";

const addSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["ADMIN", "STAFF"]),
});

type AddValues = z.input<typeof addSchema>;

export function AllowedEmailsManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [items, setItems] = useState<AllowedEmail[]>([]);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AllowedEmail | null>(
    null,
  );

  const form = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { email: "", role: "STAFF" },
  });

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [membersData, workspaceData] = await Promise.all([
        apiClient(token).get<{ allowedEmails: AllowedEmail[] }>(
          "/admin/allowed-emails",
        ),
        apiClient(token).get<{
          workspace: { allowedEmailDomains: string[] };
        }>("/admin/workspace"),
      ]);
      setItems(membersData.allowedEmails);
      setAllowedDomains(workspaceData.workspace.allowedEmailDomains ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team members");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(values: AddValues) {
    if (!token) return;
    setError(null);

    if (
      allowedDomains.length > 0 &&
      !isEmailDomainAllowed(values.email, allowedDomains)
    ) {
      setError(
        `Email must use an allowed domain: ${formatAllowedDomains(allowedDomains)}`,
      );
      return;
    }

    try {
      await apiClient(token).post("/admin/allowed-emails", values);
      form.reset({ email: "", role: "STAFF" });
      toast.success(`Invite sent to ${values.email}`);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to invite member";
      setError(message);
      toast.error(message);
    }
  }

  async function toggleActive(item: AllowedEmail) {
    if (!token) return;
    setUpdatingId(item.id);
    setError(null);
    try {
      await apiClient(token).patch(`/admin/allowed-emails/${item.id}`, {
        isActive: !item.isActive,
      });
      toast.success(
        item.isActive
          ? `${item.email} deactivated`
          : `${item.email} reactivated`,
      );
      setDeactivateTarget(null);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update member";
      setError(message);
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="size-5 text-primary" />
            Invite someone
          </CardTitle>
          <CardDescription>
            They&apos;ll receive an email with a temporary password. Admins and
            staff sign in with their work email and complete their profile on
            first login.
          </CardDescription>
          {allowedDomains.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {allowedDomains.map((domain) => (
                <Badge key={domain} variant="secondary">
                  @{domain}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-4 md:grid-cols-3"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={
                          allowedDomains.length > 0
                            ? `name@${allowedDomains[0]}`
                            : "staff@example.com"
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="STAFF">Staff</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-3">
                <Button type="submit" variant="premium" size="lg" className="h-11 rounded-lg">
                  Send invite
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members yet"
          description="Invite your first staff member to get started."
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{roleLabel(item.role)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "outline"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={updatingId === item.id}
                      onClick={() =>
                        item.isActive
                          ? setDeactivateTarget(item)
                          : void toggleActive(item)
                      }
                    >
                      {updatingId === item.id
                        ? "Saving…"
                        : item.isActive
                          ? "Deactivate"
                          : "Reactivate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {deactivateTarget?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              They won&apos;t be able to sign in or receive reminder emails until
              reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                deactivateTarget && void toggleActive(deactivateTarget)
              }
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
