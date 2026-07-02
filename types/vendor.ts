export type DayOfWeek =
  | "MON"
  | "TUE"
  | "WED"
  | "THU"
  | "FRI"
  | "SAT"
  | "SUN";

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

export interface Vendor {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  accountName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  isActive: boolean;
  createdAt?: string;
  averageRating?: number | null;
  reviewCount?: number;
}

export interface VendorReview {
  id: string;
  rating: number;
  comment: string | null;
  staffName: string;
  weekStart: string | null;
  createdAt: string;
}

export interface VendorPaymentDetails {
  accountName: string;
  bankName: string;
  accountNumber: string;
}

export type MenuItemKind = "FOOD" | "PACK";

export interface MenuItem {
  id: string;
  workspaceId: string;
  vendorId: string;
  dayOfWeek: DayOfWeek;
  name: string;
  description: string;
  priceCents: number;
  itemKind: MenuItemKind;
  packsRequired: number;
  isAvailable: boolean;
  updatedAt?: string;
}
