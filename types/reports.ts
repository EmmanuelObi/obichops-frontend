export type FinanceReportGranularity = "week" | "month";

export interface FinanceReportSummary {
  menuWeekCount: number;
  submittedOrderCount: number;
  participatingStaffCount: number;
  totalCents: number;
  companyCoveredCents: number;
  excessCents: number;
  excessCollectedCents: number;
  excessOutstandingCents: number;
}

export interface FinanceReportBucket {
  key: string;
  label: string;
  menuWeekIds: string[];
  weekStart: string | null;
  status: string | null;
  vendor: { id: string; name: string } | null;
  orderCount: number;
  participatingStaffCount: number;
  totalCents: number;
  companyCoveredCents: number;
  excessCents: number;
  excessCollectedCents: number;
  excessOutstandingCents: number;
}

export interface FinanceReportVendorRow {
  vendorId: string;
  vendorName: string;
  weekCount: number;
  orderCount: number;
  totalCents: number;
  companyCoveredCents: number;
  excessCents: number;
}

export interface FinanceReportStaffRow {
  staffName: string;
  staffEmail: string;
  orderCount: number;
  totalCents: number;
  companyCoveredCents: number;
  excessCents: number;
  excessCollectedCents: number;
  excessOutstandingCents: number;
}

export interface FinanceReport {
  workspace: { id: string; name: string; timezone: string };
  period: {
    from: string;
    to: string;
    granularity: FinanceReportGranularity;
  };
  summary: FinanceReportSummary;
  buckets: FinanceReportBucket[];
  byVendor: FinanceReportVendorRow[];
  byStaff: FinanceReportStaffRow[];
}
