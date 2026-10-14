// Domain types — mirror the DB tables (supabase/migrations/0001_schema.sql)
// and the prototype data model (README §7).

export type Role = "owner" | "ops_manager" | "supervisor" | "trainer" | "admin";
export type EmployeeStatus = "on-shift" | "off-shift";
export type QuizStatus = "pass" | "needs-review";
export type EventKind = "coaching" | "action";
export type ActionType = "refresher" | "requiz" | "message";

export interface Location {
  id: string;
  name: string;
  area: string | null;
  staff: number;
  open: number;
  quality: number;
  compliance: number;
  issues: number;
  trend: number;
}

export interface Employee {
  id: string;
  org_id?: string;
  location_id: string | null;
  name: string;
  role: string | null;
  status: EmployeeStatus;
  score: number;
  tasks: number;
  tasks_wk: number;
  quality: number;
  sop: number;
  reliability: number;
  training: number;
  escalations: number;
  tenure: string | null;
  shift: string | null;
  channel: string | null;
  delta: number;
  initials: string;
  phone?: string | null;
}

export interface QuizRecord {
  employee_id: string;
  sop: string;
  sop_id: string;
  score: number;
  total: number;
  knowledge: number;
  status: QuizStatus;
  taken_at: string;
  missed: string[];
  trend: number[];
  attempts: number;
  rec: string;
}

export interface EmployeeEvent {
  id: string;
  employee_id: string;
  actor_id: string | null;
  kind: EventKind;
  action_type: ActionType | null;
  channel: string | null;
  good: boolean;
  body: string;
  created_at: string; // ISO
}

// Employee joined with its location name (what the list/profile render).
export interface EmployeeWithLocation extends Employee {
  location_name: string | null;
}

// ── Overview (manager home) ──────────────────────────────────────────────────
export interface StatTile {
  key: string;
  label: string;
  value: string;
  sub: string | null;
  delta: string | null;
  dir: "up" | "down";
  invert: boolean;
  spark: number[];
  sort: number;
}

export interface Briefing {
  body: string;
  stamp: string | null;
}

export interface Insight {
  id: string;
  sev: "crit" | "warn" | "good";
  body: string;
  action_label: string | null;
  sort: number;
}

export interface VerificationSummary {
  calls_today: number;
  ready_rate: number;
  not_ready: number;
  avg_confidence: number;
  not_ready_employee_id: string | null;
  not_ready_sop: string | null;
  not_ready_knowledge: number | null;
}

// ── escalations ──────────────────────────────────────────────────────────────
export type Severity = "critical" | "high" | "med";
export type EscalationStatus = "open" | "approved" | "reassigned" | "snoozed";

export interface Escalation {
  id: string;
  location_id: string | null;
  sev: Severity;
  title: string;
  when_label: string | null;
  summary: string | null;
  action: string | null;
  evidence: string | null;
  owner_employee_id: string | null;
  status: EscalationStatus;
  created_at?: string;
}

export interface EscalationDetail extends Escalation {
  location_name: string | null;
  owner_name: string | null;
  owner_initials: string | null;
}

// ── tasks ────────────────────────────────────────────────────────────────────
export type Priority = "high" | "med" | "low";
export type TaskStatus = "todo" | "in-progress" | "review" | "overdue" | "done";

export interface Task {
  id: string;
  location_id: string | null;
  title: string;
  assignee_employee_id: string | null;
  priority: Priority;
  status: TaskStatus;
  due_label: string | null;
  source: string | null;
}

export interface TaskDetail extends Task {
  location_name: string | null;
  assignee_name: string | null;
}

// ── rich task detail (the operational investigation view) ────────────────────
export type EscalationLevel = "none" | "low" | "med" | "high";

export interface TimelineEntry {
  at: string;
  actor: "AI" | "Employee" | "Manager";
  body: string;
}
export interface ChecklistItem {
  label: string;
  done: boolean;
}
export interface TaskMedia {
  kind: "photo" | "video";
  label: string;
  result: "pass" | "fail" | null;
  note?: string;
}
export interface InspectionCheck {
  label: string;
  pass: boolean;
}
export interface ActivityMessage {
  who: "employee" | "ai";
  body: string;
  at?: string;
}

// The JSONB `detail` document on a task. All fields optional in seed; the data
// layer fills sensible defaults so every task opens a coherent page.
export interface TaskDetailDoc {
  created_at_label?: string;
  created_by?: string;
  reason?: string;
  completion_deadline?: string;
  escalation_level?: EscalationLevel;
  description?: string;
  sop_id?: string;
  sop_title?: string;
  training_title?: string;
  equipment?: string[];
  quality_standard?: string;
  verification_required?: boolean;
  time_spent?: string;
  ai_confidence?: number | null;
  sop_adherence?: number | null;
  ai_detected?: string[];
  ai_recommendation?: string;
  timeline?: TimelineEntry[];
  checklist?: ChecklistItem[];
  media?: TaskMedia[];
  inspection_checks?: InspectionCheck[];
  activity?: ActivityMessage[];
  ai_insights?: string[];
}

// Fully-assembled detail (base task + joined names + resolved detail doc).
export interface TaskFull extends TaskDetail {
  origin: "ai" | "manual";
  created_at_label: string;
  created_by: string;
  reason: string | null;
  completion_deadline: string | null;
  escalation_level: EscalationLevel;
  description: string;
  sop_id: string | null;
  sop_title: string | null;
  training_title: string | null;
  equipment: string[];
  quality_standard: string | null;
  verification_required: boolean;
  time_spent: string | null;
  ai_confidence: number | null;
  sop_adherence: number | null;
  ai_detected: string[];
  ai_recommendation: string | null;
  timeline: TimelineEntry[];
  checklist: ChecklistItem[];
  media: TaskMedia[];
  inspection_checks: InspectionCheck[];
  activity: ActivityMessage[];
  ai_insights: string[];
}

// ── AI reminder calls ────────────────────────────────────────────────────────
export type ReminderStatus = "pending" | "calling" | "done" | "failed" | "skipped" | "canceled";
export type CallSource = "scheduled" | "manual";
export type CallOutcome =
  | "queued" | "ringing" | "answered" | "no-answer" | "voicemail" | "failed" | "stub";

export interface ReminderSettings {
  org_id: string;
  enabled: boolean;
  quiet_start: string; // 'HH:MM:SS'
  quiet_end: string;
  timezone: string;
}

export interface Reminder {
  id: string;
  employee_id: string;
  task_id: string | null;
  scheduled_for: string; // ISO
  note: string | null;
  source: CallSource;
  status: ReminderStatus;
  attempts: number;
  created_at: string;
}

export interface ReminderWithNames extends Reminder {
  employee_name: string | null;
  task_title: string | null;
}

export interface CallLog {
  id: string;
  reminder_id: string | null;
  employee_id: string | null;
  task_id: string | null;
  source: CallSource;
  note: string | null;
  outcome: CallOutcome;
  vapi_call_id: string | null;
  transcript: string | null;
  summary: string | null;
  duration_seconds: number | null;
  started_at: string;
  ended_at: string | null;
}

// ── AI brain: post-call extraction (REPORTED, not verified) ─────────────────
export type ReportedTaskStatus = "done" | "in_progress" | "blocked" | "not_started";

// The structured object the model returns (null = couldn't determine; never guessed).
// (Named ExtractedOutcome to avoid clashing with CallOutcome, the call-result enum.)
export interface ExtractedOutcome {
  reported_task_status: ReportedTaskStatus | null;
  acknowledged: boolean | null;
  needs_help: boolean | null;
  blocker: string | null;
  follow_up_needed: boolean | null;
  notes: string | null;
}

export interface CallExtraction extends ExtractedOutcome {
  id: string;
  call_log_id: string;
  transcript: string | null;
  model: string | null;
  source: "manual_test" | "auto";
  created_at: string;
}

export interface CallLogWithNames extends CallLog {
  employee_name: string | null;
  task_title: string | null;
  extraction?: CallExtraction | null; // latest AI extraction, if any
}

export type TaskActionType =
  | "reassign"
  | "escalate"
  | "approve_override"
  | "note"
  | "ai_follow_up"
  | "retraining"
  | "verification_call";

// ── verification calls ───────────────────────────────────────────────────────
export type Readiness = "ready" | "borderline" | "not-ready";

export interface VerificationCall {
  id: string;
  employee_id: string | null;
  sop: string | null;
  sop_id: string | null;
  when_label: string | null;
  dur: string | null;
  knowledge: number;
  confidence: number;
  readiness: Readiness;
  trend: number[];
  follow: number;
  flags: string[];
  summary: string | null;
}

export interface VerificationCallDetail extends VerificationCall {
  employee_name: string | null;
  initials: string | null;
}

export interface VerificationTurn {
  ord: number;
  who: "ai" | "emp";
  body: string;
  tag: string | null;
  kind: "challenge" | "coach" | "advance" | "verdict" | null;
  confidence: number | null;
  quality: "strong" | "partial" | "weak" | null;
  hesitation: boolean;
}
