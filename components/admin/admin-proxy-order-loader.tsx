"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { CalendarOff } from "lucide-react";

import { AdminProxyOrderingPage } from "@/components/admin/admin-proxy-ordering-page";
import { EmptyState } from "@/components/layout/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import type { StaffOrder } from "@/types/order";
import type { ProxyOrderRecipient } from "@/types/proxy-order";

interface AdminProxyOrderLoaderProps {
  weekId: string;
  userId?: string;
  placedForName?: string;
  orderId?: string;
}

export function AdminProxyOrderLoader({
  weekId,
  userId,
  placedForName,
  orderId,
}: AdminProxyOrderLoaderProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [recipient, setRecipient] = useState<ProxyOrderRecipient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const staticRecipient = useMemo((): ProxyOrderRecipient | null => {
    if (userId) {
      return {
        recipientType: "STAFF",
        userId,
        displayName: "Staff member",
      };
    }
    if (placedForName?.trim()) {
      const name = placedForName.trim();
      return {
        recipientType: "CUSTOM",
        placedForName: name,
        displayName: name,
      };
    }
    return null;
  }, [userId, placedForName]);

  const load = useCallback(async () => {
    if (!token) return;

    if (staticRecipient && !orderId) {
      if (staticRecipient.recipientType === "STAFF") {
        try {
          const data = await apiClient(token).get<{
            order: StaffOrder | null;
            recipient: ProxyOrderRecipient;
          }>(`/admin/menu-weeks/${weekId}/proxy-order?userId=${userId}`);
          setRecipient(data.recipient);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load recipient");
        } finally {
          setLoading(false);
        }
        return;
      }
      setRecipient(staticRecipient);
      setLoading(false);
      return;
    }

    if (orderId) {
      try {
        const data = await apiClient(token).get<{
          order: StaffOrder | null;
          recipient: ProxyOrderRecipient | null;
        }>(`/admin/menu-weeks/${weekId}/proxy-order?orderId=${orderId}`);
        if (!data.recipient) {
          setError("Order not found");
        } else {
          setRecipient(data.recipient);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
      return;
    }

    setError("Select who this order is for");
    setLoading(false);
  }, [token, weekId, userId, orderId, staticRecipient]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !recipient) {
    return (
      <div className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <EmptyState
          icon={CalendarOff}
          title="Missing recipient"
          description="Go back and choose who this order is for."
        />
        <Button
          nativeButton={false}
          render={
            <Link href={`/admin/weeks/${weekId}/place-order`} />
          }
        >
          Choose recipient
        </Button>
      </div>
    );
  }

  return <AdminProxyOrderingPage weekId={weekId} recipient={recipient} />;
}
