"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DateTime } from "luxon";
import { Check, Inbox, X } from "lucide-react";
import { toast } from "sonner";

import type { OnboardingRequestItem, OnboardingStatus } from "@/types/platform";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";

const STATUS_TABS: { value: OnboardingStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function statusBadgeVariant(
  status: OnboardingStatus,
): "default" | "secondary" | "destructive" {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

export function OnboardingRequestsManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [status, setStatus] = useState<OnboardingStatus>("PENDING");
  const [requests, setRequests] = useState<OnboardingRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<OnboardingRequestItem | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient(token).get<{
        requests: OnboardingRequestItem[];
      }>(`/platform/onboarding-requests?status=${status}`);
      setRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [token, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(request: OnboardingRequestItem) {
    if (!token) return;
    setActingId(request.id);
    try {
      await apiClient(token).post(
        `/platform/onboarding-requests/${request.id}/approve`,
      );
      toast.success(
        `Approved "${request.businessName}" - admin invite sent to ${request.email}`,
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setActingId(null);
    }
  }

  async function reject() {
    if (!token || !rejectTarget) return;
    setActingId(rejectTarget.id);
    try {
      await apiClient(token).post(
        `/platform/onboarding-requests/${rejectTarget.id}/reject`,
        rejectReason.trim() ? { reason: rejectReason.trim() } : {},
      );
      toast.success(`Rejected "${rejectTarget.businessName}"`);
      setRejectTarget(null);
      setRejectReason("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={status}
        onValueChange={(value) => setStatus(value as OnboardingStatus)}
      >
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={
            status === "PENDING"
              ? "No pending requests"
              : `No ${status.toLowerCase()} requests`
          }
          description={
            status === "PENDING"
              ? "New business onboarding requests will appear here for review."
              : undefined
          }
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Submitted</TableHead>
                {status !== "PENDING" ? <TableHead>Reviewed</TableHead> : null}
                {status === "PENDING" ? (
                  <TableHead className="text-right">Actions</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{request.businessName}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          {request.slug}
                        </span>
                        <Badge variant={statusBadgeVariant(request.status)}>
                          {request.status.toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-sm">{request.contactName}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.email}
                      </p>
                      {request.phone ? (
                        <p className="text-sm text-muted-foreground">
                          {request.phone}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-60 space-y-0.5">
                      {request.teamSize ? (
                        <p className="text-sm text-muted-foreground">
                          Team size: {request.teamSize}
                        </p>
                      ) : null}
                      {request.notes ? (
                        <p className="truncate text-sm text-muted-foreground" title={request.notes}>
                          {request.notes}
                        </p>
                      ) : null}
                      {request.rejectionReason ? (
                        <p className="text-sm text-destructive">
                          Reason: {request.rejectionReason}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {DateTime.fromISO(request.createdAt).toFormat("d LLL yyyy")}
                  </TableCell>
                  {status !== "PENDING" ? (
                    <TableCell className="text-sm text-muted-foreground">
                      {request.reviewedAt
                        ? DateTime.fromISO(request.reviewedAt).toFormat(
                            "d LLL yyyy",
                          )
                        : "-"}
                      {request.reviewedByEmail ? (
                        <p className="text-xs">{request.reviewedByEmail}</p>
                      ) : null}
                    </TableCell>
                  ) : null}
                  {status === "PENDING" ? (
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          variant="premium"
                          size="sm"
                          disabled={actingId === request.id}
                          onClick={() => void approve(request)}
                        >
                          <Check className="size-4" />
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={actingId === request.id}
                          onClick={() => setRejectTarget(request)}
                        >
                          <X className="size-4" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Reject {rejectTarget?.businessName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The requester will be notified by email. You can include an
              optional note explaining why.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            rows={3}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Optional note to the requester..."
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actingId !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={actingId !== null}
              onClick={() => void reject()}
            >
              Reject request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
