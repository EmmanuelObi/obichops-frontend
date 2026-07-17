"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import type { WorkspaceOverview } from "@/types/platform";
import { WorkspaceOverviewPanel } from "@/components/platform/workspace-overview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";

interface WorkspaceOverviewClientProps {
  workspaceId: string;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

export function WorkspaceOverviewClient({
  workspaceId,
}: WorkspaceOverviewClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [data, setData] = useState<WorkspaceOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const overview = await apiClient(token).get<WorkspaceOverview>(
        `/platform/workspaces/${workspaceId}`,
      );
      setData(overview);
      setAuditRefreshKey((value) => value + 1);
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("not found")) {
        router.replace("/platform/workspaces");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load chopspace");
    } finally {
      setLoading(false);
    }
  }, [token, workspaceId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <OverviewSkeleton />;
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

  return (
    <WorkspaceOverviewPanel
      data={data}
      onUpdated={load}
      auditRefreshKey={auditRefreshKey}
    />
  );
}
