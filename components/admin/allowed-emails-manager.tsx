"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Search, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import type { AllowedEmail, TeamMemberStatus } from "@/types/auth";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { isEmailDomainAllowed, formatAllowedDomains } from "@/lib/email-domain";
import { roleLabel, teamMemberStatusLabel } from "@/lib/labels";

const addSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["ADMIN", "STAFF"]),
});

type AddValues = z.input<typeof addSchema>;
type TeamTab = TeamMemberStatus;

function memberHasName(item: AllowedEmail): boolean {
  return Boolean(item.firstName?.trim() || item.lastName?.trim());
}

function memberSortKey(item: AllowedEmail): string {
  if (memberHasName(item) && item.displayName) {
    return item.displayName.toLowerCase();
  }
  return item.email.toLowerCase();
}

function matchesSearch(item: AllowedEmail, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [item.email, item.displayName, item.firstName, item.lastName]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(normalized));
}

function sortMembers(items: AllowedEmail[], tab: TeamTab): AllowedEmail[] {
  const sorted = [...items];
  if (tab === "inactive") {
    return sorted.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }
  return sorted.sort((a, b) =>
    memberSortKey(a).localeCompare(memberSortKey(b)),
  );
}

function statusBadgeVariant(
  status: TeamMemberStatus,
): "success" | "warning" | "outline" {
  switch (status) {
    case "active":
      return "success";
    case "pending":
      return "warning";
    default:
      return "outline";
  }
}

function emptyStateForTab(tab: TeamTab) {
  switch (tab) {
    case "pending":
      return {
        title: "No pending invites",
        description: "Everyone invited has completed their profile.",
      };
    case "inactive":
      return {
        title: "No inactive members",
        description: "Deactivated members will appear here.",
      };
    default:
      return {
        title: "No active team members",
        description: "Invite someone or check the Pending tab for invites awaiting setup.",
      };
  }
}

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
  const [activeTab, setActiveTab] = useState<TeamTab>("active");
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { email: "", role: "STAFF" },
  });

  const counts = useMemo(
    () => ({
      active: items.filter((item) => item.status === "active").length,
      pending: items.filter((item) => item.status === "pending").length,
      inactive: items.filter((item) => item.status === "inactive").length,
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    const byTab = items.filter((item) => item.status === activeTab);
    const bySearch = byTab.filter((item) => matchesSearch(item, searchQuery));
    return sortMembers(bySearch, activeTab);
  }, [items, activeTab, searchQuery]);

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
      setActiveTab("pending");
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
      if (item.isActive) {
        setActiveTab("inactive");
      } else {
        setActiveTab(item.status === "pending" ? "pending" : "active");
      }
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update member";
      setError(message);
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  }

  function renderMemberCell(item: AllowedEmail) {
    if (memberHasName(item) && item.displayName) {
      return (
        <div>
          <p className="font-medium">{item.displayName}</p>
          <p className="text-sm text-muted-foreground">{item.email}</p>
        </div>
      );
    }
    return <span>{item.email}</span>;
  }

  function renderTable() {
    if (filteredItems.length === 0) {
      const empty = emptyStateForTab(activeTab);
      return searchQuery.trim() ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No members match &ldquo;{searchQuery.trim()}&rdquo;.
        </p>
      ) : (
        <EmptyState
          icon={Users}
          title={empty.title}
          description={empty.description}
        />
      );
    }

    return (
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{renderMemberCell(item)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{roleLabel(item.role)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(item.status)}>
                    {teamMemberStatusLabel(item.status)}
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
    );
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="size-5 text-primary" />
            Team roster
          </CardTitle>
          <CardDescription>
            Active members, pending invites, and deactivated accounts are kept
            separate so this list stays easy to scan.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TeamTab)}
            >
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <TabsList>
                  <TabsTrigger value="active">
                    Active ({counts.active})
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    Pending ({counts.pending})
                  </TabsTrigger>
                  <TabsTrigger value="inactive">
                    Inactive ({counts.inactive})
                  </TabsTrigger>
                </TabsList>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by name or email"
                    className="pl-9"
                  />
                </div>
              </div>

              <TabsContent value="active">{renderTable()}</TabsContent>
              <TabsContent value="pending">{renderTable()}</TabsContent>
              <TabsContent value="inactive">{renderTable()}</TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Deactivate {deactivateTarget?.displayName ?? deactivateTarget?.email}?
            </AlertDialogTitle>
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
