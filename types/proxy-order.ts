import type { OrderStatus } from "@/types/order";

export interface ProxyStaffRecipient {
  userId: string;
  name: string;
  email: string;
  hasOrder: boolean;
  orderId: string | null;
  orderStatus: OrderStatus | null;
}

export type ProxyOrderRecipient =
  | {
      recipientType: "STAFF";
      userId: string;
      displayName: string;
    }
  | {
      recipientType: "CUSTOM";
      placedForName: string;
      displayName: string;
    };

export interface ProxyOrderRecipientPayload {
  recipientType: "STAFF" | "CUSTOM";
  userId?: string;
  placedForName?: string;
}

export function toProxyOrderRecipientPayload(
  recipient: ProxyOrderRecipient,
): ProxyOrderRecipientPayload {
  if (recipient.recipientType === "STAFF") {
    return { recipientType: "STAFF", userId: recipient.userId };
  }
  return { recipientType: "CUSTOM", placedForName: recipient.placedForName };
}
