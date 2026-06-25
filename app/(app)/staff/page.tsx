import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StaffOrderingPage } from "@/components/staff/staff-ordering-page";

export const metadata: Metadata = {
  title: "Order meals",
};

export default function StaffHomePage() {
  return (
    <PageContainer size="narrow">
      <PageHeader
        title="This week"
        description="Browse the menu and build your order for the week."
      />
      <StaffOrderingPage />
    </PageContainer>
  );
}
