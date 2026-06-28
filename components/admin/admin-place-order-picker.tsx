"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users } from "lucide-react";

import { StaffMemberSearch } from "@/components/admin/staff-member-search";
import type { ProxyStaffRecipient } from "@/types/proxy-order";
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
import { apiClient } from "@/lib/api-client";

type RecipientMode = "staff" | "custom";

interface AdminPlaceOrderPickerProps {
  weekId: string;
}

export function AdminPlaceOrderPicker({ weekId }: AdminPlaceOrderPickerProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [staff, setStaff] = useState<ProxyStaffRecipient[]>([]);
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("staff");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [customName, setCustomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient(token).get<{ staff: ProxyStaffRecipient[] }>(
        `/admin/menu-weeks/${weekId}/proxy-recipients`,
      );
      setStaff(data.staff);
      if (data.staff.length === 0) {
        setRecipientMode("custom");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, [token, weekId]);

  useEffect(() => {
    void load();
  }, [load]);

  function continueToOrder() {
    if (recipientMode === "custom") {
      const name = customName.trim();
      if (!name) {
        setError("Enter a name for this order");
        return;
      }
      router.push(
        `/admin/weeks/${weekId}/place-order/order?name=${encodeURIComponent(name)}`,
      );
      return;
    }

    if (!selectedUserId) {
      setError("Select a staff member from the list");
      return;
    }

    router.push(
      `/admin/weeks/${weekId}/place-order/order?userId=${selectedUserId}`,
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="size-5" />
            Who is this order for?
          </CardTitle>
          <CardDescription>
            Search for a team member, or enter a custom name for someone without
            an account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="recipient-mode">Recipient type</Label>
                <Select
                  value={recipientMode}
                  onValueChange={(value) => {
                    if (value === "staff" || value === "custom") {
                      setRecipientMode(value);
                      setError(null);
                    }
                  }}
                >
                  <SelectTrigger id="recipient-mode" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff" disabled={staff.length === 0}>
                      Team member
                    </SelectItem>
                    <SelectItem value="custom">Custom (no login)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recipientMode === "staff" ? (
                <StaffMemberSearch
                  staff={staff}
                  selectedUserId={selectedUserId}
                  onSelect={(userId) => {
                    setSelectedUserId(userId);
                    setError(null);
                  }}
                  onClear={() => {
                    setSelectedUserId("");
                    setError(null);
                  }}
                />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="custom-name">Person&apos;s name</Label>
                  <Input
                    id="custom-name"
                    value={customName}
                    onChange={(event) => {
                      setCustomName(event.target.value);
                      setError(null);
                    }}
                    placeholder="e.g. Front desk team"
                    maxLength={120}
                  />
                  <p className="text-sm text-muted-foreground">
                    Use this for office workers who don&apos;t have their own
                    login.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/admin/weeks/${weekId}/orders`} />}
            >
              Cancel
            </Button>
            <Button onClick={continueToOrder} disabled={loading}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
