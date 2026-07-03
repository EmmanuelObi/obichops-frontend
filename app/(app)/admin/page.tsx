import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { hasPlatformWorkspaceContext } from "@/lib/platform-workspace-server";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function AdminDashboardPage() {
  const session = await auth();
  const hasWorkspace = await hasPlatformWorkspaceContext(
    session?.user?.workspaceId,
  );

  if (session?.user?.role === "SUPER_ADMIN" && !hasWorkspace) {
    redirect("/platform/workspaces");
  }

  return (
    <PageContainer>
      <PageHeader title="Overview" description="Your workspace at a glance." />
      <AdminDashboard
        userName={session?.user?.name ?? session?.user?.email}
        isSuperAdmin={session?.user?.role === "SUPER_ADMIN"}
        hasWorkspace={hasWorkspace}
      />
    </PageContainer>
  );
}
