import type { Metadata } from "next";

import { AllowedEmailsManager } from "@/components/admin/allowed-emails-manager";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Team",
};

export default function AllowedEmailsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Team members"
        description="Invite staff and admins. They receive a temporary password and must set a new one on first login."
      />
      <AllowedEmailsManager />
    </PageContainer>
  );
}
