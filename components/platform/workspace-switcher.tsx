"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Building2, LogOut } from "lucide-react";

import type { PlatformWorkspace } from "@/types/platform";
import { usePlatformWorkspace } from "@/hooks/use-platform-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";

export function WorkspaceSwitcher() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const { selection, isManagingWorkspace, switchWorkspace, exitWorkspace } =
    usePlatformWorkspace();
  const [workspaces, setWorkspaces] = useState<PlatformWorkspace[]>([]);

  const load = useCallback(async () => {
    if (!token || !isManagingWorkspace) return;
    try {
      const data = await apiClient(token).get<{ workspaces: PlatformWorkspace[] }>(
        "/platform/workspaces",
      );
      setWorkspaces(data.workspaces);
    } catch {
      setWorkspaces([]);
    }
  }, [token, isManagingWorkspace]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isManagingWorkspace || !selection) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className="hidden sm:inline-flex">
        Platform admin
      </Badge>
      <Select
        value={selection.id}
        onValueChange={(value) => {
          const workspace = workspaces.find((item) => item.id === value);
          if (workspace) {
            switchWorkspace({
              id: workspace.id,
              name: workspace.name,
              slug: workspace.slug,
            });
          }
        }}
      >
        <SelectTrigger className="h-9 w-[min(100%,14rem)]">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="size-4 shrink-0" />
            <SelectValue placeholder="Select workspace" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {workspaces.map((workspace) => (
            <SelectItem key={workspace.id} value={workspace.id}>
              {workspace.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" size="sm" onClick={exitWorkspace}>
        <LogOut className="size-4" />
        Exit
      </Button>
    </div>
  );
}
