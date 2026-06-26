"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { useSession } from "next-auth/react";
import { BarChart3, Download } from "lucide-react";
import { toast } from "sonner";

import type {
  FinanceReport,
  FinanceReportGranularity,
} from "@/types/reports";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { downloadAuthenticatedFile } from "@/lib/download";
import { formatNaira } from "@/lib/format";
import { statusBadgeBase, statusBadgeClass } from "@/lib/status-badges";
import { cn } from "@/lib/utils";

type PeriodPreset =
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "last_6_months"
  | "custom";

const PRESET_LABELS: Record<PeriodPreset, string> = {
  this_month: "This month",
  last_month: "Last month",
  last_3_months: "Last 3 months",
  last_6_months: "Last 6 months",
  custom: "Custom range",
};

function resolvePresetRange(
  preset: PeriodPreset,
  timezone: string,
): { from: string; to: string } {
  const now = DateTime.now().setZone(timezone);

  switch (preset) {
    case "this_month":
      return {
        from: now.startOf("month").toISODate()!,
        to: now.endOf("month").toISODate()!,
      };
    case "last_month": {
      const last = now.minus({ months: 1 });
      return {
        from: last.startOf("month").toISODate()!,
        to: last.endOf("month").toISODate()!,
      };
    }
    case "last_3_months":
      return {
        from: now.minus({ months: 3 }).startOf("month").toISODate()!,
        to: now.endOf("day").toISODate()!,
      };
    case "last_6_months":
      return {
        from: now.minus({ months: 6 }).startOf("month").toISODate()!,
        to: now.endOf("day").toISODate()!,
      };
    default:
      return {
        from: now.minus({ months: 3 }).startOf("month").toISODate()!,
        to: now.endOf("day").toISODate()!,
      };
  }
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function FinanceReportsManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [preset, setPreset] = useState<PeriodPreset>("last_3_months");
  const [granularity, setGranularity] =
    useState<FinanceReportGranularity>("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timezone = report?.workspace.timezone ?? "Africa/Lagos";

  const activeRange = useMemo(() => {
    if (preset === "custom" && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    return resolvePresetRange(preset, timezone);
  }, [preset, customFrom, customTo, timezone]);

  const load = useCallback(async () => {
    if (!token) return;
    if (preset === "custom" && (!customFrom || !customTo)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        from: activeRange.from,
        to: activeRange.to,
        granularity,
      });
      const res = await apiClient(token).get<{ report: FinanceReport }>(
        `/admin/reports/finance?${params.toString()}`,
      );
      setReport(res.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [token, activeRange.from, activeRange.to, granularity, preset, customFrom, customTo]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (preset === "custom" && !customFrom && !customTo) {
      const range = resolvePresetRange("last_3_months", timezone);
      setCustomFrom(range.from);
      setCustomTo(range.to);
    }
  }, [preset, customFrom, customTo, timezone]);

  async function handleDownload() {
    if (!token) return;
    try {
      const params = new URLSearchParams({
        from: activeRange.from,
        to: activeRange.to,
        granularity,
      });
      await downloadAuthenticatedFile(
        `/admin/reports/finance/export?${params.toString()}`,
        token,
        "finance-report.csv",
      );
      toast.success("Downloaded CSV report");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    }
  }

  const periodLabel = report
    ? `${DateTime.fromISO(report.period.from).toFormat("d LLL yyyy")} – ${DateTime.fromISO(report.period.to).toFormat("d LLL yyyy")}`
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report period</CardTitle>
          <CardDescription>
            Summarise submitted orders for finance review. Dates use your
            workspace timezone ({timezone.replace(/_/g, " ")}).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="period-preset">Period</Label>
              <Select
                value={preset}
                onValueChange={(value) => setPreset(value as PeriodPreset)}
                items={Object.entries(PRESET_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              >
                <SelectTrigger id="period-preset" className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRESET_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {preset === "custom" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="from-date">From</Label>
                  <Input
                    id="from-date"
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full sm:w-40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to-date">To</Label>
                  <Input
                    id="to-date"
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full sm:w-40"
                  />
                </div>
              </>
            ) : null}

            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <Button variant="outline" onClick={() => void load()}>
                Refresh
              </Button>
              <Button
                variant="premium"
                onClick={() => void handleDownload()}
                disabled={loading || !report}
              >
                <Download className="size-4" />
                Export CSV
              </Button>
            </div>
          </div>

          <Tabs
            value={granularity}
            onValueChange={(value) =>
              setGranularity(value as FinanceReportGranularity)
            }
          >
            <TabsList>
              <TabsTrigger value="week">By week</TabsTrigger>
              <TabsTrigger value="month">By month</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : report ? (
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="size-4" />
            <span>
              {periodLabel} · {report.summary.menuWeekCount} menu week
              {report.summary.menuWeekCount === 1 ? "" : "s"} ·{" "}
              {report.summary.submittedOrderCount} submitted order
              {report.summary.submittedOrderCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Company spend"
              value={formatNaira(report.summary.companyCoveredCents)}
              hint={`${report.summary.participatingStaffCount} staff · ${report.summary.submittedOrderCount} orders`}
            />
            <SummaryCard
              label="Total meal value"
              value={formatNaira(report.summary.totalCents)}
              hint="Gross order value before excess split"
            />
            <SummaryCard
              label="Staff excess"
              value={formatNaira(report.summary.excessCents)}
              hint={`Collected ${formatNaira(report.summary.excessCollectedCents)}`}
            />
            <SummaryCard
              label="Excess outstanding"
              value={formatNaira(report.summary.excessOutstandingCents)}
              hint="Not yet marked as paid"
            />
          </div>

          <Tabs defaultValue="period">
            <TabsList>
              <TabsTrigger value="period">
                {granularity === "week" ? "Weekly" : "Monthly"} breakdown
              </TabsTrigger>
              <TabsTrigger value="vendors">By vendor</TabsTrigger>
              <TabsTrigger value="staff">By staff</TabsTrigger>
            </TabsList>

            <TabsContent value="period" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {granularity === "week" ? "Weekly" : "Monthly"} totals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {report.buckets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No menu weeks with submitted orders in this period.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            {granularity === "week" ? "Week" : "Month"}
                          </TableHead>
                          {granularity === "week" ? (
                            <TableHead>Vendor</TableHead>
                          ) : null}
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">
                            Company spend
                          </TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Excess</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.buckets.map((bucket) => (
                          <TableRow key={bucket.key}>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium">{bucket.label}</p>
                                {granularity === "week" && bucket.status ? (
                                  <span
                                    className={cn(
                                      statusBadgeBase,
                                      statusBadgeClass(bucket.status),
                                    )}
                                  >
                                    {bucket.status}
                                  </span>
                                ) : granularity === "month" ? (
                                  <p className="text-xs text-muted-foreground">
                                    {bucket.menuWeekIds.length} week
                                    {bucket.menuWeekIds.length === 1
                                      ? ""
                                      : "s"}
                                  </p>
                                ) : null}
                              </div>
                            </TableCell>
                            {granularity === "week" ? (
                              <TableCell>{bucket.vendor?.name ?? "—"}</TableCell>
                            ) : null}
                            <TableCell className="text-right tabular-nums">
                              {bucket.orderCount}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNaira(bucket.companyCoveredCents)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNaira(bucket.totalCents)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNaira(bucket.excessCents)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vendors" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Spend by vendor</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.byVendor.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No vendor data for this period.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vendor</TableHead>
                          <TableHead className="text-right">Weeks</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">
                            Company spend
                          </TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.byVendor.map((row) => (
                          <TableRow key={row.vendorId}>
                            <TableCell className="font-medium">
                              {row.vendorName}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.weekCount}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.orderCount}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNaira(row.companyCoveredCents)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNaira(row.totalCents)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Spend by staff</CardTitle>
                  <CardDescription>
                    Per-person totals across all weeks in the selected period.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {report.byStaff.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No staff orders in this period.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Staff</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">
                            Company covered
                          </TableHead>
                          <TableHead className="text-right">Excess</TableHead>
                          <TableHead className="text-right">
                            Outstanding
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.byStaff.map((row) => (
                          <TableRow key={row.staffEmail}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{row.staffName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {row.staffEmail}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.orderCount}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNaira(row.companyCoveredCents)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNaira(row.excessCents)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatNaira(row.excessOutstandingCents)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </div>
  );
}
