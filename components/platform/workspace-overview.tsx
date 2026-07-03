"use client";

import Link from "next/link";
import { DateTime } from "luxon";
import { ArrowLeft, Building2, CalendarDays, ShoppingBag, Store, Users } from "lucide-react";

import type { WorkspaceOverview } from "@/types/platform";
import { ManageWorkspaceButton } from "@/components/platform/manage-workspace-button";
import { PlatformAuditLog } from "@/components/platform/platform-audit-log";
import { WorkspaceAdminForm } from "@/components/platform/workspace-admin-form";
import { WorkspaceSettingsForm } from "@/components/platform/workspace-settings-form";
import { WorkspaceStatusActions } from "@/components/platform/workspace-status-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNaira } from "@/lib/format";
import { menuWeekDisplayLabel } from "@/lib/labels";
import { statusBadgeBase, statusBadgeClass } from "@/lib/status-badges";
import { cn } from "@/lib/utils";

interface WorkspaceOverviewPanelProps {
  data: WorkspaceOverview;
  onUpdated?: () => void | Promise<void>;
  auditRefreshKey?: number;
}

function formatActivity(value: string | null): string {
  if (!value) return "No activity yet";
  return DateTime.fromISO(value).toFormat("d LLL yyyy, h:mm a");
}

export function WorkspaceOverviewPanel({
  data,
  onUpdated,
  auditRefreshKey = 0,
}: WorkspaceOverviewPanelProps) {
  const { workspace, stats, recentMenuWeeks, vendors, recentOrders } = data;
  const settings = workspace.settings ?? {
    timezone: "Africa/Lagos",
    allowedEmailDomains: [],
    defaultMaxOrderAmountCents: 500_000,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/platform/workspaces"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 w-fit" })}
          >
            <ArrowLeft className="size-4" />
            All workspaces
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl font-semibold tracking-tight">
              {workspace.name}
            </h1>
            <Badge variant={workspace.isActive ? "default" : "secondary"}>
              {workspace.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Slug <span className="font-mono">{workspace.slug}</span>
            {workspace.createdAt
              ? ` · Created ${DateTime.fromISO(workspace.createdAt).toFormat("d LLL yyyy")}`
              : null}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <Badge variant="outline" className="w-fit">
            Read-only platform view
          </Badge>
          <div className="flex flex-wrap justify-end gap-2">
            <WorkspaceStatusActions
              workspace={workspace}
              onUpdated={onUpdated}
            />
            <ManageWorkspaceButton
              workspace={workspace}
              variant="premium"
              size="sm"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="size-4" />
              Team
            </CardDescription>
            <CardTitle className="text-2xl">{stats.activeTeamCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {stats.activeStaffCount} staff · {stats.adminCount} admins
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Store className="size-4" />
              Vendors
            </CardDescription>
            <CardTitle className="text-2xl">{stats.activeVendors}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {stats.totalVendors} total configured
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              Current week
            </CardDescription>
            <CardTitle className="text-2xl">
              {stats.currentMenuWeekStatus ?? "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {stats.submittedOrdersCount} submitted orders in focus week
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ShoppingBag className="size-4" />
              Last activity
            </CardDescription>
            <CardTitle className="text-lg leading-snug">
              {formatActivity(stats.lastActivityAt)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Based on recent orders and menu weeks
          </CardContent>
        </Card>
      </div>

      <WorkspaceAdminForm
        workspaceId={workspace.id}
        adminCount={stats.adminCount}
        onCreated={onUpdated}
      />

      <WorkspaceSettingsForm
        workspaceId={workspace.id}
        settings={settings}
        onUpdated={onUpdated}
      />

      <PlatformAuditLog
        workspaceId={workspace.id}
        title="Workspace activity"
        description="Super-admin actions for this workspace."
        refreshKey={auditRefreshKey}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent menu weeks</CardTitle>
            <CardDescription>
              Latest ordering cycles for this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentMenuWeeks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No menu weeks yet.</p>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMenuWeeks.map((week) => {
                      const weekLabel = DateTime.fromISO(week.weekStart)
                        .setZone(week.timezone)
                        .toFormat("d LLL yyyy");
                      const badgeKey =
                        week.windowStatus === "OPEN"
                          ? "OPEN"
                          : week.windowStatus === "UPCOMING"
                            ? "UPCOMING"
                            : "CLOSED";

                      return (
                        <TableRow key={week.id}>
                          <TableCell>{weekLabel}</TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                statusBadgeBase,
                                statusBadgeClass(badgeKey),
                              )}
                            >
                              {menuWeekDisplayLabel(week)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {week.submittedOrderCount}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendors</CardTitle>
            <CardDescription>
              Food suppliers configured for this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {vendors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vendors yet.</p>
            ) : (
              <div className="space-y-3">
                {vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">{vendor.email}</p>
                    </div>
                    <Badge variant={vendor.isActive ? "default" : "secondary"}>
                      {vendor.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>
            Latest submitted orders across all weeks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Building2 className="size-8 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                No submitted orders yet for this workspace.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.recipientName}</p>
                          {order.recipientEmail ? (
                            <p className="text-sm text-muted-foreground">
                              {order.recipientEmail}
                            </p>
                          ) : order.isCustomRecipient ? (
                            <p className="text-sm text-muted-foreground">
                              Custom recipient
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.submittedAt
                          ? DateTime.fromISO(order.submittedAt).toFormat(
                              "d LLL yyyy, h:mm a",
                            )
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNaira(order.totalCents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
