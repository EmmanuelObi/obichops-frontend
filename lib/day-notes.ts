import type { OrderDayNote } from "@/types/order";
import type { DayOfWeek } from "@/types/vendor";

export const DAY_NOTE_MAX_LENGTH = 300;

export function dayNotesToRecord(
  notes?: OrderDayNote[] | null,
): Record<string, string> {
  const record: Record<string, string> = {};
  for (const entry of notes ?? []) record[entry.dayOfWeek] = entry.note;
  return record;
}

export function dayNotesToPayload(
  record: Record<string, string>,
  days: DayOfWeek[],
): OrderDayNote[] {
  return days
    .map((day) => ({ dayOfWeek: day, note: (record[day] ?? "").trim() }))
    .filter((entry) => entry.note.length > 0);
}
