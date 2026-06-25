"use client";

import Link from "next/link";
import { DateTime } from "luxon";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  CalendarDays,
  Store,
  Users,
  ArrowRight,
  Building2,
} from "lucide-react";

import type { AllowedEmail } from "@/types/auth";
import type { MenuWeek } from "@/types/menu-week";
import type { Vendor } from "@/types/vendor";
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
import { formatNaira } from "@/lib/format";
import { menuWeekDisplayBadgeKey, menuWeekDisplayLabel } from "@/lib/labels";
import { statusBadgeBase, statusBadgeClass } from "@/lib/status-badges";
import { cn } from "@/lib/utils";

interface AdminDashboardProps {
  userName?: string | null;
  isSuperAdmin?: boolean;
  hasWorkspace?: boolean;
}

export function AdminDashboard({
  userName,
  isSuperAdmin,
  hasWorkspace = true,
}: AdminDashboardProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [weeks, setWeeks] = useState<MenuWeek[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [members, setMembers] = useState<AllowedEmail[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token || !hasWorkspace) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [weeksRes, vendorsRes, membersRes] = await Promise.all([
        apiClient(token).get<{ menuWeeks: MenuWeek[] }>("/admin/menu-weeks"),
        apiClient(token).get<{ vendors: Vendor[] }>("/admin/vendors"),
        apiClient(token).get<{ allowedEmails: AllowedEmail[] }>(
          "/admin/allowed-emails",
        ),
      ]);
      setWeeks(weeksRes.menuWeeks);
      setVendors(vendorsRes.vendors.filter((v) => v.isActive));
      setMembers(membersRes.allowedEmails);
    } finally {
      setLoading(false);
    }
  }, [token, hasWorkspace]);

  useEffect(() => {
    void load();
  }, [load]);

  const currentWeek =
    weeks.find((w) => w.status === "OPEN") ??
    weeks.find((w) => w.windowStatus === "UPCOMING") ??
    weeks[0];

  const activeMembers = members.filter((m) => m.isActive).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <p className="text-sm text-muted-foreground">
        Welcome back{userName ? `, ${userName}` : ""}.
      </p>

      <Card className="border-gold/20 bg-gradient-to-br from-primary/[0.04] via-card to-accent/40">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5 text-gold" strokeWidth={1.75} />
                This week
              </CardTitle>
              <CardDescription>
                {currentWeek
                  ? `Week of ${DateTime.fromISO(currentWeek.weekStart)
                      .setZone(currentWeek.timezone)
                      .toFormat("d LLL yyyy")}`
                  : "No menu week configured yet"}
              </CardDescription>
            </div>
            {currentWeek ? (
              <span
                className={cn(
                  statusBadgeBase,
                  statusBadgeClass(menuWeekDisplayBadgeKey(currentWeek)),
                )}
              >
                {menuWeekDisplayLabel(currentWeek)}
              </span>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {currentWeek ? (
            <>
              <p className="text-sm text-muted-foreground">
                {formatNaira(currentWeek.maxOrderAmountCents)}/day · up to{" "}
                {currentWeek.maxOrderDaysPerStaff ?? 2} order{" "}
                {(currentWeek.maxOrderDaysPerStaff ?? 2) === 1 ? "day" : "days"} · Closes{" "}
                {DateTime.fromISO(currentWeek.orderWindowClosesAt)
                  .setZone(currentWeek.timezone)
                  .toFormat("ccc d LLL, h:mm a")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/weeks/${currentWeek.id}/orders`}
                  className={buttonVariants({ variant: "premium", size: "lg", className: "h-11 rounded-lg" })}
                >
                  View orders
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/admin/weeks"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Manage weeks
                </Link>
              </div>
            </>
          ) : (
            <Link
              href="/admin/weeks"
              className={buttonVariants({ variant: "premium", size: "lg", className: "h-11 rounded-lg" })}
            >
              Create menu week
            </Link>
          )}
        </CardContent>
      </Card>

      <div className="stagger-children grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="size-4 text-muted-foreground" />
              Vendors
            </CardTitle>
            <CardDescription>
              {vendors.length} active vendor{vendors.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/vendors" className={buttonVariants({ variant: "outline" })}>
              Manage vendors
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-muted-foreground" />
              Team
            </CardTitle>
            <CardDescription>
              {activeMembers} active member{activeMembers === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/allowed-emails"
              className={buttonVariants({ variant: "outline" })}
            >
              Manage team
            </Link>
          </CardContent>
        </Card>

        {isSuperAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4 text-muted-foreground" />
                Platform
              </CardTitle>
              <CardDescription>Super-admin workspace management</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/platform/workspaces"
                className={buttonVariants({ variant: "secondary" })}
              >
                Workspaces
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
