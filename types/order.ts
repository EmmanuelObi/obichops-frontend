import type { DayOfWeek } from "./vendor";

export type OrderStatus = "DRAFT" | "SUBMITTED";

export type ExcessPaymentStatus = "NONE" | "OUTSTANDING" | "PROOF_UPLOADED" | "PAID";

export interface OrderLineItem {
  menuItemId: string;
  dayOfWeek: DayOfWeek;
  quantity: number;
  unitPriceCentsSnapshot: number | null;
}

export interface StaffOrder {
  id: string;
  menuWeekId: string;
  userId?: string | null;
  placedForName?: string | null;
  placedByUserId?: string | null;
  status: OrderStatus;
  lineItems: OrderLineItem[];
  totalCents: number;
  companyCoveredCents: number;
  excessCents: number;
  excessAcknowledged: boolean;
  excessAcknowledgedAt: string | null;
  submittedAt: string | null;
  excessPaymentProofFilename: string | null;
  excessPaymentProofUploadedAt: string | null;
  excessPaidAt: string | null;
  hasExcessPaymentProof: boolean;
}

export interface StaffOrderHistoryLineItem extends OrderLineItem {
  name: string;
}

export interface StaffOrderHistoryReview {
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffOrderHistoryEntry {
  order: StaffOrder & {
    excessPaymentStatus: ExcessPaymentStatus;
  };
  menuWeek: {
    id: string;
    weekStart: string;
    status: string;
    timezone: string;
  };
  vendor: {
    id: string;
    name: string;
  } | null;
  lineItems: StaffOrderHistoryLineItem[];
  canReview: boolean;
  review: StaffOrderHistoryReview | null;
}

export interface StaffOrderHistoryResponse {
  outstandingExcessCents: number;
  outstandingOrderCount: number;
  orders: StaffOrderHistoryEntry[];
}

export interface AdminWeekOrder {
  id: string;
  userId: string | null;
  placedForName: string | null;
  isCustomRecipient: boolean;
  placedByUserId: string | null;
  staffName: string;
  staffEmail: string;
  status: OrderStatus;
  totalCents: number;
  companyCoveredCents: number;
  excessCents: number;
  excessAcknowledged: boolean;
  excessPaymentStatus: ExcessPaymentStatus;
  excessPaymentProofUploadedAt: string | null;
  excessPaidAt: string | null;
  submittedAt: string | null;
  lineItemCount: number;
}

export interface ExcessPaymentProofUrlResponse {
  downloadUrl: string;
  expiresInSeconds: number;
  filename: string;
  mimeType: string | null;
}

export interface ExcessPaymentUploadUrlResponse {
  storageKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
}
