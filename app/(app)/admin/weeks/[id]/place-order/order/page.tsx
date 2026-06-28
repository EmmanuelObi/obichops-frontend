import type { Metadata } from "next";
import Link from "next/link";

import { AdminProxyOrderLoader } from "@/components/admin/admin-proxy-order-loader";
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

export const metadata: Metadata = {
  title: "Place order",
};

export default async function AdminPlaceOrderOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    userId?: string;
    name?: string;
    orderId?: string;
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  return (
    <PageContainer>
      <PageHeader
        title="Place order"
        description="Build and submit an order on someone else's behalf."
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/admin/weeks" />}>
                  Menu weeks
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href={`/admin/weeks/${id}/orders`} />}>
                  Orders
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href={`/admin/weeks/${id}/place-order`} />}>
                  Place order
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Order</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />
      <AdminProxyOrderLoader
        weekId={id}
        userId={query.userId}
        placedForName={query.name}
        orderId={query.orderId}
      />
    </PageContainer>
  );
}
