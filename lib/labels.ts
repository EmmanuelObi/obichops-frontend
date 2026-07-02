export function menuWeekStatusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Not started";
    case "OPEN":
      return "Ordering open";
    case "CLOSED":
      return "Closed";
    default:
      return status;
  }
}

export function windowStatusLabel(status: string): string {
  switch (status) {
    case "OPEN":
      return "Ordering open";
    case "UPCOMING":
      return "Opens soon";
    case "CLOSED":
      return "Ordering closed";
    default:
      return status;
  }
}

export function menuWeekDisplayLabel(week: {
  status: string;
  windowStatus: string;
}): string {
  if (week.windowStatus === "OPEN") {
    return "Ordering open";
  }

  if (week.windowStatus === "UPCOMING") {
    return week.status === "DRAFT" ? "Not started" : "Opens soon";
  }

  if (week.status === "CLOSED") {
    return "Closed";
  }

  if (week.status === "OPEN") {
    return "Ordering closed";
  }

  return "Closed";
}

export function menuWeekDisplayBadgeKey(week: {
  status: string;
  windowStatus: string;
}): string {
  if (week.windowStatus === "OPEN") {
    return "OPEN";
  }

  if (week.windowStatus === "UPCOMING") {
    return "UPCOMING";
  }

  return "CLOSED";
}

export function roleLabel(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super admin";
    case "ADMIN":
      return "Admin";
    case "STAFF":
      return "Staff";
    default:
      return role;
  }
}

export function teamMemberStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Active";
    case "pending":
      return "Pending invite";
    case "inactive":
      return "Inactive";
    default:
      return status;
  }
}

export function formatVendorRating(
  averageRating: number | null | undefined,
  reviewCount: number | undefined,
): string {
  if (!reviewCount || averageRating == null) return "—";
  return `${averageRating.toFixed(1)} ★ (${reviewCount})`;
}

export function orderStatusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "SUBMITTED":
      return "Submitted";
    default:
      return status;
  }
}

export function excessPaymentStatusLabel(status: string): string {
  switch (status) {
    case "OUTSTANDING":
      return "Payment outstanding";
    case "PROOF_UPLOADED":
      return "Pending review";
    case "PAID":
      return "Paid";
    case "NONE":
      return "No excess";
    default:
      return status;
  }
}
