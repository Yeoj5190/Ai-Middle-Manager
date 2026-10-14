// Shared status/severity styling maps used across the ops surfaces.
import type { Priority, Readiness, Severity, TaskStatus } from "@/lib/types";

export const SEV: Record<Severity, { c: string; code: string; label: string }> = {
  critical: { c: "var(--crit)", code: "P1", label: "Critical" },
  high: { c: "var(--warn)", code: "P2", label: "High" },
  med: { c: "var(--info)", code: "P3", label: "Medium" },
};

export const READY: Record<Readiness, { c: string; short: string; label: string }> = {
  ready: { c: "var(--good)", short: "Ready", label: "Ready to work independently" },
  borderline: { c: "var(--warn)", short: "Borderline", label: "Borderline — re-check" },
  "not-ready": { c: "var(--crit)", short: "Not ready", label: "Not ready — retraining" },
};

export const QUALITY: Record<string, { c: string; l: string }> = {
  strong: { c: "var(--good)", l: "strong" },
  partial: { c: "var(--warn)", l: "partial" },
  weak: { c: "var(--crit)", l: "weak" },
};

export const PRIORITY: Record<Priority, string> = {
  high: "var(--crit)",
  med: "var(--warn)",
  low: "var(--fg-3)",
};

export const TASK_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "in-progress", label: "In progress" },
  { key: "review", label: "Review" },
  { key: "overdue", label: "Overdue" },
  { key: "done", label: "Done" },
];
