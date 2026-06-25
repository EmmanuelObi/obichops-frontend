import type { Metadata } from "next";

import { VendorsManager } from "@/components/admin/vendors-manager";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Vendors",
};

export default function VendorsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Vendors"
        description="Manage food vendors and their persistent menu catalogs."
      />
      <VendorsManager />
    </PageContainer>
  );
}
