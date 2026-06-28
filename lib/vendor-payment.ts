import type { CurrentMenuWeekResponse } from "@/types/menu-week";

type VendorLike = CurrentMenuWeekResponse["vendor"];

export function vendorHasPaymentDetails(
  vendor: VendorLike,
): vendor is NonNullable<VendorLike> & {
  accountName: string;
  bankName: string;
  accountNumber: string;
} {
  if (!vendor) return false;
  return Boolean(
    vendor.accountName?.trim() &&
      vendor.bankName?.trim() &&
      vendor.accountNumber?.trim(),
  );
}
