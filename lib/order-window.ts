import { DateTime } from "luxon";

export const DEFAULT_CHOPSPACE_TIMEZONE = "Africa/Lagos";

/** `datetime-local` value format without seconds. */
export function toDateTimeLocalValue(dt: DateTime): string {
  return dt.toFormat("yyyy-MM-dd'T'HH:mm");
}

/** Same defaults as backend `computeDefaultOrderWindow` (Fri 2pm → Sat 10am before week). */
export function defaultOrderWindowLocalInputs(
  weekStartDate: string,
  timezone: string = DEFAULT_CHOPSPACE_TIMEZONE,
): { orderWindowOpensAt: string; orderWindowClosesAt: string } {
  const monday = DateTime.fromISO(weekStartDate, { zone: timezone }).startOf("day");
  if (!monday.isValid) {
    return { orderWindowOpensAt: "", orderWindowClosesAt: "" };
  }

  const opens = monday.minus({ days: 3 }).set({
    hour: 14,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  const closes = monday.minus({ days: 2 }).set({
    hour: 10,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  return {
    orderWindowOpensAt: toDateTimeLocalValue(opens),
    orderWindowClosesAt: toDateTimeLocalValue(closes),
  };
}

/** Convert a `datetime-local` value to ISO-8601 with offset for the API. */
export function localDateTimeToOffsetIso(
  local: string,
  timezone: string = DEFAULT_CHOPSPACE_TIMEZONE,
): string | null {
  const dt = DateTime.fromISO(local, { zone: timezone });
  if (!dt.isValid) return null;
  return dt.toISO({ suppressMilliseconds: true, includeOffset: true });
}
