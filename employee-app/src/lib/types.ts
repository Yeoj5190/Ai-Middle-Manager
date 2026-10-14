// Hand-written row types for the slices the employee app reads. (Swap for
// generated types via `supabase gen types typescript` once auth is wired.)

export type TaskStatus = "todo" | "in-progress" | "review" | "overdue" | "done";
export type TaskPriority = "high" | "med" | "low";

export interface Employee {
  id: string;
  name: string;
  role: string | null;
  status: "on-shift" | "off-shift";
  score: number;
  tasks_wk: number;
  shift: string | null;
  initials: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_label: string | null;
  assignee_employee_id: string | null;
  sop_id: string | null;
}

export interface Briefing {
  id: string;
  body: string;
  stamp: string | null;
  created_at: string;
}

export interface ChecklistItem {
  key: string;
  label: string;
  critical?: boolean;
}

export interface Sop {
  id: string;
  title: string;
  category: string | null;
  checklist: ChecklistItem[];
}

export interface QualityResultItem {
  key: string;
  label: string;
  pass: boolean;
  reason: string;
}

export interface QualityResult {
  overall: "pass" | "fail" | "partial";
  score: number;
  results: QualityResultItem[];
  photo_summary?: string;
  area?: string;
  relevant?: boolean;
}

export type CheckinKind = "daily_checkin" | "task_reminder" | "task_checkin";

export interface Checkin {
  id: string;
  kind: CheckinKind;
  task_id: string | null;
  opens_call: boolean;
  context: { task_title?: string } | null;
  fire_at: string;
}
