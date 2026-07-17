"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import type { PlatformWorkspace } from "@/types/platform";
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
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

interface WorkspaceStatusActionsProps {
  chopspace: Pick<PlatformWorkspace, "id" | "name" | "isActive">;
  onUpdated?: () => void | Promise<void>;
  size?: "sm" | "default";
}

export function WorkspaceStatusActions({
  chopspace,
  onUpdated,
  size = "sm",
}: WorkspaceStatusActionsProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function toggleStatus() {
    if (!token) return;
    setSaving(true);
    try {
      await apiClient(token).patch(`/platform/workspaces/${chopspace.id}`, {
        isActive: !chopspace.isActive,
      });
      toast.success(
        chopspace.isActive ? "Chopspace suspended" : "Chopspace reactivated",
      );
      setConfirmOpen(false);
      await onUpdated?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update chopspace",
      );
    } finally {
      setSaving(false);
    }
  }

  if (chopspace.isActive) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          size={size}
          onClick={() => setConfirmOpen(true)}
        >
          <Ban className="size-4" />
          Suspend
        </Button>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Suspend {chopspace.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Staff and admins won&apos;t be able to sign in or place orders
                until this chopspace is reactivated. Super admins can still
                manage it from the platform.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={saving}
                onClick={() => void toggleStatus()}
              >
                Suspend chopspace
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      disabled={saving}
      onClick={() => void toggleStatus()}
    >
      <CheckCircle2 className="size-4" />
      Reactivate
    </Button>
  );
}
