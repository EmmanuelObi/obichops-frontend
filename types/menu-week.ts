import type { DayOfWeek } from "./vendor";

export type MenuWeekStatus = "DRAFT" | "OPEN" | "CLOSED";
export type WindowUiStatus = "UPCOMING" | "OPEN" | "CLOSED";

export interface MenuWeek {
  id: string;
  workspaceId: string;
  weekStart: string;
  activeVendorId: string;
  orderableDays: DayOfWeek[];
  maxOrderAmountCents: number;
  maxOrderDaysPerStaff?: number;
  orderWindowOpensAt: string;
  orderWindowClosesAt: string;
  status: MenuWeekStatus;
  windowStatus: WindowUiStatus;
  orderingAllowed: boolean;
  timezone: string;
}

export interface CurrentMenuWeekResponse {
  menuWeek: MenuWeek | null;
  vendor: {
    id: string;
    name: string;
    email: string;
    accountName: string | null;
    bankName: string | null;
    accountNumber: string | null;
  } | null;
  menu: Array<{
    id: string;
    vendorId: string;
    dayOfWeek: DayOfWeek;
    name: string;
    description: string;
    priceCents: number;
    itemKind?: "FOOD" | "PACK";
    packsRequired?: number;
    isAvailable: boolean;
  }>;
  packMenu: Array<{
    id: string;
    dayOfWeek: DayOfWeek;
    priceCents: number;
  }>;
}
