import { supabase } from "./supabase";
import {
  ANALYZE_PHOTO_URL,
  DEMO_ORG_ID,
  SUPABASE_ANON_KEY,
  dateStrInTz,
} from "../config";
import { currentEmployeeId } from "./session";
import type {
  Briefing,
  Checkin,
  ChecklistItem,
  Employee,
  QualityResult,
  Sop,
  Task,
} from "./types";

// All queries are scoped to the demo employee/org for this no-auth test build.

export async function fetchMe(): Promise<Employee | null> {
  const { data, error } = await supabase
    .from("employees")
    .select("id,name,role,status,score,tasks_wk,shift,initials")
    .eq("id", currentEmployeeId())
    .single();
  if (error) throw error;
  return data;
}

// Resolve which employee a signed-in auth user is (via employees.auth_user_id).
export async function fetchEmployeeForAuthUser(
  userId: string,
): Promise<Employee | null> {
  const { data, error } = await supabase
    .from("employees")
    .select("id,name,role,status,score,tasks_wk,shift,initials")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Tasks for a given day (defaults to "today" in the demo timezone).
export async function fetchMyTasks(date?: string): Promise<Task[]> {
  const day = date ?? dateStrInTz();
  const { data, error } = await supabase
    .from("tasks")
    .select("id,title,status,priority,due_label,assignee_employee_id,sop_id")
    .eq("assignee_employee_id", currentEmployeeId())
    .eq("org_id", DEMO_ORG_ID)
    .eq("task_date", day)
    .order("due_at", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyBriefing(): Promise<Briefing | null> {
  const { data, error } = await supabase
    .from("briefings")
    .select("id,body,stamp,created_at")
    .eq("employee_id", currentEmployeeId())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchSop(id: string): Promise<Sop | null> {
  const { data, error } = await supabase
    .from("sops")
    .select("id,title,category,checklist")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Sop | null;
}

// Append a call event to the task trail (used when a voice call ends).
export async function logCall(note: string, taskId?: string): Promise<void> {
  if (!taskId) return;
  await supabase.from("task_logs").insert({
    org_id: DEMO_ORG_ID,
    task_id: taskId,
    employee_id: currentEmployeeId(),
    event: "call",
    body: note,
  });
}

// Score a photo. With a checklist → SOP mode; without → general area inspection.
export async function analyzePhoto(
  image: string,
  checklist?: ChecklistItem[],
  sopTitle?: string,
): Promise<QualityResult> {
  const res = await fetch(ANALYZE_PHOTO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ image, checklist: checklist ?? [], sop_title: sopTitle }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = typeof data?.error === "string" ? data.error : JSON.stringify(data?.error ?? data);
    throw new Error(msg);
  }
  return data as QualityResult;
}

// Mark a task done (also logs a 'completed' event, which cancels its scheduled
// check-ins and tells the dispatcher to skip any pending follow-up).
export async function markTaskDone(taskId: string): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ status: "done" })
    .eq("id", taskId)
    .eq("org_id", DEMO_ORG_ID);
  if (error) throw error;
  await supabase.from("task_logs").insert({
    org_id: DEMO_ORG_ID,
    task_id: taskId,
    employee_id: currentEmployeeId(),
    event: "completed",
    body: "Marked done from Today",
  });
  // clear any outstanding check-in notifications for this task
  await supabase
    .from("checkins")
    .update({ acknowledged_at: new Date().toISOString() })
    .eq("task_id", taskId)
    .eq("org_id", DEMO_ORG_ID)
    .is("acknowledged_at", null);
}

// Reopen a completed task (un-check it) — sets it back to todo and logs a note.
export async function reopenTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ status: "todo" })
    .eq("id", taskId)
    .eq("org_id", DEMO_ORG_ID);
  if (error) throw error;
  await supabase.from("task_logs").insert({
    org_id: DEMO_ORG_ID,
    task_id: taskId,
    employee_id: currentEmployeeId(),
    event: "note",
    body: "Reopened from Today",
  });
}

// ── in-app check-in notifications ────────────────────────────────────────────
// Check-ins that have fired (or are due) and the worker hasn't acted on yet.
export async function fetchDueCheckins(): Promise<Checkin[]> {
  const now = new Date();
  const recent = new Date(now.getTime() - 12 * 3600 * 1000); // last 12h only
  const { data, error } = await supabase
    .from("checkins")
    .select("id,kind,task_id,opens_call,context,fire_at")
    .eq("employee_id", currentEmployeeId())
    .eq("org_id", DEMO_ORG_ID)
    .in("status", ["pending", "sent"])
    .is("acknowledged_at", null)
    .lte("fire_at", now.toISOString())
    .gte("fire_at", recent.toISOString())
    .order("fire_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Checkin[];
}

// Worker handled a check-in (done / called / dismissed) — stop showing it.
export async function acknowledgeCheckin(id: string): Promise<void> {
  await supabase
    .from("checkins")
    .update({ acknowledged_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", DEMO_ORG_ID);
}

// Create a task from something the worker reported on a call (e.g. "out of towels").
export async function createReportedTask(
  title: string,
  details?: string,
  urgency: "high" | "med" | "low" = "med",
): Promise<{ id: string; title: string }> {
  const id = `T-${Math.floor(100000 + Math.random() * 900000)}`;
  const { error } = await supabase.from("tasks").insert({
    id,
    org_id: DEMO_ORG_ID,
    title,
    assignee_employee_id: currentEmployeeId(),
    priority: urgency,
    status: "todo",
    source: "ai-report",
    task_date: dateStrInTz(),
  });
  if (error) throw error;
  // breadcrumb on the new task (best-effort)
  await supabase.from("task_logs").insert({
    org_id: DEMO_ORG_ID,
    task_id: id,
    employee_id: currentEmployeeId(),
    event: "note",
    body: `[ai-report] Logged during call.${details ? " " + details : ""}`,
  });
  return { id, title };
}

// Persist a completed quality check (task_id null for a general in-call check).
export async function saveQualityCheck(
  taskId: string | null,
  sopId: string | null,
  result: QualityResult,
): Promise<void> {
  await supabase.from("quality_checks").insert({
    org_id: DEMO_ORG_ID,
    task_id: taskId,
    employee_id: currentEmployeeId(),
    sop_id: sopId,
    overall: result.overall,
    score: result.score,
    results: result.results,
  });
}
