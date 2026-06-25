import type { Metadata } from "next";

import { MenuWeeksManager } from "@/components/admin/menu-weeks-manager";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Menu weeks",
};

export default function MenuWeeksPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Menu weeks"
        description="Configure weekly ordering windows, vendors, and budgets."
      />
      <MenuWeeksManager />
    </PageContainer>
  );
}
