// In-memory store for dev-fallback mode (no Supabase). Lets mutations persist
// for the life of the dev server process so the action loops are visibly
// functional before a database is connected. Unused once Supabase is configured
// (real rows are written instead).
import type { CallLog, EmployeeEvent, EscalationStatus, TimelineEntry } from "@/lib/types";

const g = globalThis as unknown as {
  __ammEvents?: EmployeeEvent[];
  __ammEscStatus?: Record<string, EscalationStatus>;
  __ammTaskTimeline?: Record<string, TimelineEntry[]>;
  __ammCallLogs?: CallLog[];
};
g.__ammEvents ??= [];
g.__ammEscStatus ??= {};
g.__ammTaskTimeline ??= {};
g.__ammCallLogs ??= [];

export const fallbackEvents = g.__ammEvents;
export const fallbackEscStatus = g.__ammEscStatus;
// Manager actions append audit-trail entries here, keyed by task id.
export const fallbackTaskTimeline = g.__ammTaskTimeline;
// Stub "Call now" entries in dev-fallback mode.
export const fallbackCallLogs = g.__ammCallLogs;
