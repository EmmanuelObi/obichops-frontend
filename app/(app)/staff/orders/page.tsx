import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StaffOrderHistoryPage } from "@/components/staff/staff-order-history-page";

export const metadata: Metadata = {
  title: "My orders",
};

export default function StaffOrdersPage() {
  return (
    <PageContainer size="narrow">
      <PageHeader
        title="My orders"
        description="Review past weeks and upload proof of payment for any excess you owe."
      />
      <StaffOrderHistoryPage />
    </PageContainer>
  );
}
