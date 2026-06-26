export interface ReminderLogEntry {
  id: string;
  type: string;
  sentAt: string;
  recipientCount: number;
}

export const REMINDER_LABELS: Record<string, string> = {
  ORDERING_OPEN: "Ordering open",
  FRIDAY_NUDGE_1: "Nudge — Friday 5:00 PM",
  FRIDAY_NUDGE_2: "Nudge — Friday 8:00 PM",
  SATURDAY_NUDGE: "Nudge — Saturday 8:00 AM",
};

/** Legacy log types from before the schedule change. */
export const LEGACY_REMINDER_LABELS: Record<string, string> = {
  WINDOW_OPEN: "Window open (legacy)",
  PENDING_NUDGE: "Saturday nudge 8:00 AM (legacy)",
  FINAL_NUDGE: "Final nudge 9:30 AM (legacy)",
  FRIDAY_REMINDER_1: "Friday — ordering open (legacy)",
  FRIDAY_REMINDER_2: "Friday — evening (legacy)",
  SATURDAY_REMINDER: "Saturday — morning (legacy)",
};

export function reminderLabel(type: string): string {
  return REMINDER_LABELS[type] ?? LEGACY_REMINDER_LABELS[type] ?? type;
}

export function isNudgeReminder(type: string): boolean {
  return (
    type === "FRIDAY_NUDGE_1" ||
    type === "FRIDAY_NUDGE_2" ||
    type === "SATURDAY_NUDGE" ||
    type === "FRIDAY_REMINDER_2" ||
    type === "SATURDAY_REMINDER" ||
    type === "PENDING_NUDGE" ||
    type === "FINAL_NUDGE"
  );
}
