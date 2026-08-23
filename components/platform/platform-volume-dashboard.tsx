"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { DateTime } from "luxon";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Building2, ShoppingBag, Users } from "lucide-react";

import type {
  PlatformVolumeGranularity,
  PlatformVolumeReport,
} from "@/types/platform";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { formatNaira } from "@/lib/format";

const GRANULARITY_LABELS: Record<PlatformVolumeGranularity, string> = {
  week: "Weekly",
  month: "Monthly",
  year: "Yearly",
};

function formatCompactNaira(cents: number): string {
  const naira = cents / 100;
  if (naira >= 1_000_000) {
    return `₦${(naira / 1_000_000).toFixed(1)}M`;
  }
  if (naira >= 1_000) {
    return `₦${(naira / 1_000).toFixed(0)}K`;
  }
  return formatNaira(cents);
}

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
          <Icon className="size-4" />
          {label}
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent className="text-sm text-muted-foreground">{hint}</CardContent>
      ) : null}
    </Card>
  );
}

function VolumeSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

export function PlatformVolumeDashboard() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [granularity, setGranularity] =
    useState<PlatformVolumeGranularity>("week");
  const [report, setReport] = useState<PlatformVolumeReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ granularity });
      const response = await apiClient(token).get<{ report: PlatformVolumeReport }>(
        `/platform/analytics/volume?${params.toString()}`,
      );
      setReport(response.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load volume data");
    } finally {
      setLoading(false);
    }
  }, [token, granularity]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = useMemo(() => {
    if (!report) return [];
    return report.buckets.map((bucket) => ({
      label: bucket.label,
      orders: bucket.orderCount,
      volumeNaira: bucket.totalCents / 100,
      volumeLabel: formatNaira(bucket.totalCents),
      chopspaces: bucket.activeChopspacesCount,
    }));
  }, [report]);

  if (loading) {
    return <VolumeSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!report) {
    return null;
  }

  const periodLabel = `${DateTime.fromISO(report.period.from).toFormat("d LLL yyyy")} – ${DateTime.fromISO(report.period.to).toFormat("d LLL yyyy")}`;

  return (
    <div className="space-y-6">
      <Tabs
        value={granularity}
        onValueChange={(value) =>
          setGranularity(value as PlatformVolumeGranularity)
        }
      >
        <TabsList>
          {(Object.keys(GRANULARITY_LABELS) as PlatformVolumeGranularity[]).map(
            (key) => (
              <TabsTrigger key={key} value={key}>
                {GRANULARITY_LABELS[key]}
              </TabsTrigger>
            ),
          )}
        </TabsList>

        {(Object.keys(GRANULARITY_LABELS) as PlatformVolumeGranularity[]).map(
          (key) => (
            <TabsContent key={key} value={key} className="mt-6 space-y-6">
              <p className="text-sm text-muted-foreground">
                {GRANULARITY_LABELS[key]} volume across all chopspaces ·{" "}
                {periodLabel} ({report.timezone.replace(/_/g, " ")})
              </p>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  icon={ShoppingBag}
                  label="Submitted orders"
                  value={report.summary.orderCount.toLocaleString()}
                  hint={`${report.summary.menuWeekCount} menu weeks in range`}
                />
                <SummaryCard
                  icon={Building2}
                  label="Order volume"
                  value={formatNaira(report.summary.totalCents)}
                  hint="Total spend across chopspaces"
                />
                <SummaryCard
                  icon={Users}
                  label="Participating staff"
                  value={report.summary.participatingStaffCount.toLocaleString()}
                  hint="Unique order recipients"
                />
                <SummaryCard
                  icon={Building2}
                  label="Active chopspaces"
                  value={report.summary.activeChopspacesCount.toLocaleString()}
                  hint="Chopspaces with submitted orders"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Volume over time</CardTitle>
                  <CardDescription>
                    Submitted orders and total spend by{" "}
                    {GRANULARITY_LABELS[key].toLowerCase()} period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length === 0 ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      No submitted orders in this period yet.
                    </p>
                  ) : (
                    <div className="h-[360px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-border/60"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 12 }}
                            interval="preserveStartEnd"
                            minTickGap={24}
                          />
                          <YAxis
                            yAxisId="orders"
                            allowDecimals={false}
                            tick={{ fontSize: 12 }}
                            width={40}
                          />
                          <YAxis
                            yAxisId="volume"
                            orientation="right"
                            tick={{ fontSize: 12 }}
                            width={56}
                            tickFormatter={(value: number) =>
                              formatCompactNaira(value * 100)
                            }
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "0.5rem",
                              border: "1px solid hsl(var(--border))",
                              background: "hsl(var(--card))",
                            }}
                            formatter={(value, name, item) => {
                              if (name === "volumeNaira") {
                                return [
                                  item.payload.volumeLabel,
                                  "Order volume",
                                ];
                              }
                              return [value, "Orders"];
                            }}
                            labelFormatter={(label) => String(label)}
                          />
                          <Legend />
                          <Bar
                            yAxisId="orders"
                            dataKey="orders"
                            name="Orders"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            yAxisId="volume"
                            dataKey="volumeNaira"
                            name="Order volume (₦)"
                            fill="hsl(var(--gold))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>By chopspace</CardTitle>
                  <CardDescription>
                    Ranked by total order volume in the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {report.byWorkspace.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No chopspace activity in this period.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Chopspace</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">Volume</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.byWorkspace.map((row) => (
                          <TableRow key={row.workspaceId}>
                            <TableCell className="font-medium">
                              {row.workspaceName}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.orderCount}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNaira(row.totalCents)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Link
                                href={`/platform/workspaces/${row.workspaceId}`}
                                className={buttonVariants({
                                  variant: "outline",
                                  size: "sm",
                                })}
                              >
                                View
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ),
        )}
      </Tabs>
    </div>
  );
}
