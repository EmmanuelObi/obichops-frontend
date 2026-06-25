import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MenuCatalogManager } from "@/components/admin/menu-catalog-manager";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getServerAccessToken } from "@/lib/auth-session";
import type { Vendor } from "@/types/vendor";

async function getVendor(id: string, token: string): Promise<Vendor | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const response = await fetch(`${baseUrl}/admin/vendors/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error("Failed to load vendor");
  }

  const data = (await response.json()) as { vendor: Vendor };
  return data.vendor;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Vendor menu" };
}

export default async function VendorMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getServerAccessToken();
  if (!token) notFound();

  const vendor = await getVendor(id, token);
  if (!vendor) notFound();

  return (
    <PageContainer>
      <PageHeader
        title={`${vendor.name} — Menu`}
        description={vendor.email}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/admin/vendors" />}>
                  Vendors
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{vendor.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />
      <MenuCatalogManager vendorId={vendor.id} vendorName={vendor.name} />
    </PageContainer>
  );
}
