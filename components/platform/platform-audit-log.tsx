"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DateTime } from "luxon";
import { History } from "lucide-react";

import type { PlatformAuditEntry } from "@/types/platform";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { apiClient } from "@/lib/api-client";

const ACTION_LABELS: Record<PlatformAuditEntry["action"], string> = {
  WORKSPACE_CREATED: "Created",
  WORKSPACE_SUSPENDED: "Suspended",
  WORKSPACE_REACTIVATED: "Reactivated",
  WORKSPACE_UPDATED: "Updated",
  WORKSPACE_ADMIN_INVITED: "Admin invited",
  WORKSPACE_ENTERED: "Manage mode",
  ONBOARDING_APPROVED: "Onboarding approved",
  ONBOARDING_REJECTED: "Onboarding rejected",
};

interface PlatformAuditLogProps {
  workspaceId?: string;
  title?: string;
  description?: string;
  limit?: number;
  refreshKey?: number;
}

export function PlatformAuditLog({
  workspaceId,
  title = "Platform activity",
  description = "Recent super-admin actions across the platform.",
  limit = 15,
  refreshKey = 0,
}: PlatformAuditLogProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [entries, setEntries] = useState<PlatformAuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (workspaceId) {
        params.set("workspaceId", workspaceId);
      }
      const data = await apiClient(token).get<{ entries: PlatformAuditEntry[] }>(
        `/platform/audit-log?${params.toString()}`,
      );
      setEntries(data.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [token, workspaceId, limit]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Actor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {DateTime.fromISO(entry.createdAt).toFormat(
                        "d LLL yyyy, h:mm a",
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {ACTION_LABELS[entry.action]}
                    </TableCell>
                    <TableCell className="text-sm">{entry.summary}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.actorEmail}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
