import type { Metadata } from "next";

import { FinanceReportsManager } from "@/components/admin/finance-reports-manager";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Reporting",
};

export default function AdminReportsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Reporting"
        description="Weekly and monthly order summaries for finance — company spend, staff excess, and vendor breakdowns."
      />
      <FinanceReportsManager />
    </PageContainer>
  );
}
