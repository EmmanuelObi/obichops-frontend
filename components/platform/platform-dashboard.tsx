"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DateTime } from "luxon";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  ShoppingBag,
  Users,
} from "lucide-react";

import type { PlatformDashboard } from "@/types/platform";
import { PlatformAuditLog } from "@/components/platform/platform-audit-log";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";

const ATTENTION_LABELS: Record<
  PlatformDashboard["attention"][number]["reason"],
  string
> = {
  suspended: "Suspended",
  no_admin: "No admin",
  no_activity: "Idle",
  no_orders: "No orders",
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export function PlatformDashboardPanel() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [data, setData] = useState<PlatformDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const dashboard = await apiClient(token).get<PlatformDashboard>(
        "/platform/dashboard",
      );
      setData(dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  const { totals, attention } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Building2 className="size-4" />
              Chopspaces
            </CardDescription>
            <CardTitle className="text-2xl">{totals.workspaces}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {totals.activeWorkspaces} active · {totals.suspendedWorkspaces}{" "}
            suspended
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="size-4" />
              Team members
            </CardDescription>
            <CardTitle className="text-2xl">{totals.activeTeamMembers}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Active invites across all chopspaces
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              Open weeks
            </CardDescription>
            <CardTitle className="text-2xl">{totals.openMenuWeeks}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Menu weeks currently accepting orders
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 xl:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ShoppingBag className="size-4" />
              Orders this week
            </CardDescription>
            <CardTitle className="text-2xl">
              {totals.submittedOrdersThisWeek}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Submitted orders in open menu weeks
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600" />
            Needs attention
          </CardTitle>
          <CardDescription>
            Chopspaces that may need platform operator follow-up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attention.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All chopspaces look healthy.
            </p>
          ) : (
            <div className="space-y-3">
              {attention.map((item) => (
                <div
                  key={`${item.workspaceId}-${item.reason}`}
                  className="flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.name}</p>
                      <Badge variant="outline">
                        {ATTENTION_LABELS[item.reason]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.details}
                    </p>
                  </div>
                  <Link
                    href={`/platform/workspaces/${item.workspaceId}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PlatformAuditLog
        title="Recent platform activity"
        description={`Last updated ${DateTime.now().toFormat("h:mm a")}.`}
        limit={10}
      />
    </div>
  );
}
