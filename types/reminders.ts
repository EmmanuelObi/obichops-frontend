export interface ReminderLogEntry {
  id: string;
  type: "WINDOW_OPEN" | "PENDING_NUDGE" | "FINAL_NUDGE";
  sentAt: string;
  recipientCount: number;
}

export const REMINDER_LABELS: Record<ReminderLogEntry["type"], string> = {
  WINDOW_OPEN: "Window open",
  PENDING_NUDGE: "Saturday nudge (8:00 AM)",
  FINAL_NUDGE: "Final nudge (9:30 AM)",
};
