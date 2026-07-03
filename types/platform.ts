import type { MenuWeek } from "./menu-week";

export interface WorkspaceSettings {
  timezone: string;
  allowedEmailDomains: string[];
  defaultMaxOrderAmountCents: number;
}

export interface WorkspaceListStats {
  activeTeamCount: number;
  vendorCount: number;
  currentMenuWeekStatus: string | null;
  submittedOrdersCount: number;
  lastActivityAt: string | null;
}

export interface PlatformWorkspace {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  settings?: WorkspaceSettings;
  createdAt?: string;
  updatedAt?: string;
  stats: WorkspaceListStats;
}

export interface WorkspaceOverviewStats extends WorkspaceListStats {
  activeStaffCount: number;
  adminCount: number;
  totalVendors: number;
  activeVendors: number;
}

export interface WorkspaceOverviewVendor {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface WorkspaceOverviewOrder {
  id: string;
  menuWeekId: string;
  status: string;
  totalCents: number;
  submittedAt: string | null;
  recipientName: string;
  recipientEmail: string | null;
  isCustomRecipient: boolean;
}

export interface WorkspaceOverviewMenuWeek extends MenuWeek {
  submittedOrderCount: number;
}

export interface WorkspaceOverview {
  workspace: Omit<PlatformWorkspace, "stats">;
  stats: WorkspaceOverviewStats;
  recentMenuWeeks: WorkspaceOverviewMenuWeek[];
  vendors: WorkspaceOverviewVendor[];
  recentOrders: WorkspaceOverviewOrder[];
}

export type PlatformAuditAction =
  | "WORKSPACE_CREATED"
  | "WORKSPACE_SUSPENDED"
  | "WORKSPACE_REACTIVATED"
  | "WORKSPACE_UPDATED"
  | "WORKSPACE_ADMIN_INVITED"
  | "WORKSPACE_ENTERED";

export interface PlatformAuditEntry {
  id: string;
  workspaceId: string | null;
  actorUserId: string;
  actorEmail: string;
  action: PlatformAuditAction;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PlatformAttentionItem {
  workspaceId: string;
  name: string;
  slug: string;
  reason: "suspended" | "no_admin" | "no_activity" | "no_orders";
  details: string;
}

export interface PlatformDashboard {
  totals: {
    workspaces: number;
    activeWorkspaces: number;
    suspendedWorkspaces: number;
    activeTeamMembers: number;
    openMenuWeeks: number;
    submittedOrdersThisWeek: number;
  };
  attention: PlatformAttentionItem[];
  recentActivity: PlatformAuditEntry[];
}
