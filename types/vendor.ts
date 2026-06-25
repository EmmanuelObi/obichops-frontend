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
  isActive: boolean;
  createdAt?: string;
}

export interface MenuItem {
  id: string;
  workspaceId: string;
  vendorId: string;
  dayOfWeek: DayOfWeek;
  name: string;
  description: string;
  priceCents: number;
  isAvailable: boolean;
  updatedAt?: string;
}
