// Server Actions for manager actions on an employee. Each one writes an
// employee_events row (kind='action'), which appears immediately in the
// employee's AI coaching timeline (revalidatePath).
//
// In production these would also enqueue the real side-effect (send the SOP
// refresher, book a re-quiz, dispatch an AI message) — see the TODOs.
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured, DEMO_ORG_ID } from "@/lib/env";
import {
  fallbackEvents,
  fallbackEscStatus,
  fallbackTaskTimeline,
  fallbackCallLogs,
} from "@/lib/fallback-store";
import type {
  ActionType,
  CallLog,
  EmployeeEvent,
  EscalationStatus,
  TaskActionType,
  TimelineEntry,
} from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  message: string;
}

const COPY: Record<ActionType, { channel: string; body: (n: string) => string }> = {
  refresher: {
    channel: "System",
    body: (n) => `Refresher video sent to ${n} via AI. Awaiting completion.`,
  },
  requiz: {
    channel: "System",
    body: (n) => `Re-quiz scheduled for ${n} tomorrow. ${n} will be notified.`,
  },
  message: {
    channel: "Voice",
    body: (n) => `Message dispatched to ${n} through the AI manager.`,
  },
};

export async function runEmployeeAction(
  employeeId: string,
  employeeName: string,
  type: ActionType,
): Promise<ActionResult> {
  const copy = COPY[type];
  const body = copy.body(employeeName);

  if (!supabaseConfigured) {
    const event: EmployeeEvent = {
      id: `act-${Date.now()}`,
      employee_id: employeeId,
      actor_id: null,
      kind: "action",
      action_type: type,
      channel: copy.channel,
      good: true,
      body,
      created_at: new Date().toISOString(),
    };
    fallbackEvents.unshift(event);
    revalidatePath(`/employees/${employeeId}`);
    return { ok: true, message: body };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  const { error } = await supabase.from("employee_events").insert({
    org_id: profile?.org_id ?? DEMO_ORG_ID,
    employee_id: employeeId,
    actor_id: user.id,
    kind: "action",
    action_type: type,
    channel: copy.channel,
    good: true,
    body,
  });
  if (error) return { ok: false, message: error.message };

  // TODO(production): enqueue the real side-effect for `type` here
  // (SOP refresher delivery, re-quiz scheduling, AI voice/text message).

  revalidatePath(`/employees/${employeeId}`);
  return { ok: true, message: body };
}

const ESC_COPY: Record<Exclude<EscalationStatus, "open">, string> = {
  approved: "Escalation approved — recommended action dispatched.",
  reassigned: "Escalation reassigned. Owner notified.",
  snoozed: "Escalation snoozed for 1 hour.",
};

export async function setEscalationStatus(
  escalationId: string,
  status: Exclude<EscalationStatus, "open">,
): Promise<ActionResult> {
  if (!supabaseConfigured) {
    fallbackEscStatus[escalationId] = status;
    revalidatePath(`/escalations/${escalationId}`);
    revalidatePath("/escalations");
    return { ok: true, message: ESC_COPY[status] };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("escalations")
    .update({ status })
    .eq("id", escalationId);
  if (error) return { ok: false, message: error.message };

  // TODO(production): trigger the real downstream effect (dispatch/reassign job).
  revalidatePath(`/escalations/${escalationId}`);
  revalidatePath("/escalations");
  return { ok: true, message: ESC_COPY[status] };
}

// ── task manager actions ─────────────────────────────────────────────────────
// Each appends an entry to the task's audit trail (timeline). Reassign/escalate
// also change task fields in production; here we record the action.
const TASK_COPY: Record<TaskActionType, (note?: string) => string> = {
  reassign: () => "Task reassigned. New owner notified by AI.",
  escalate: () => "Task escalated. Severity raised and manager alerted.",
  approve_override: () => "Manager override approved — task marked verified.",
  note: (n) => `Note added: ${n ?? ""}`.trim(),
  ai_follow_up: () => "AI follow-up triggered — re-check scheduled.",
  retraining: () => "Retraining scheduled for the assignee.",
  verification_call: () => "Live AI verification call queued.",
};

function nowLabel() {
  return new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
}

export async function runTaskAction(
  taskId: string,
  type: TaskActionType,
  note?: string,
): Promise<ActionResult> {
  const body = TASK_COPY[type](note);
  const entry: TimelineEntry = { at: nowLabel(), actor: "Manager", body };

  if (!supabaseConfigured) {
    (fallbackTaskTimeline[taskId] ??= []).push(entry);
    revalidatePath(`/tasks/${taskId}`);
    revalidatePath("/tasks");
    return { ok: true, message: body };
  }

  const supabase = await createClient();
  const { data, error: readErr } = await supabase
    .from("tasks")
    .select("detail")
    .eq("id", taskId)
    .maybeSingle();
  if (readErr) return { ok: false, message: readErr.message };

  const detail = (data?.detail as { timeline?: TimelineEntry[] } | null) ?? {};
  const timeline = [...(detail.timeline ?? []), entry];
  const { error } = await supabase
    .from("tasks")
    .update({ detail: { ...detail, timeline } })
    .eq("id", taskId);
  if (error) return { ok: false, message: error.message };

  // TODO(production): perform the real side-effect for `type`.
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/tasks");
  return { ok: true, message: body };
}

// ── AI reminder calls ────────────────────────────────────────────────────────

// Manual "Call now" — routes through the SAME shared call path as the scheduler
// (the call_now SQL function, which delegates to fire_reminder).
export async function callNow(
  employeeId: string,
  taskId?: string | null,
  note?: string | null,
): Promise<ActionResult> {
  if (!supabaseConfigured) {
    const log: CallLog = {
      id: `call-${Date.now()}`,
      reminder_id: null,
      employee_id: employeeId,
      task_id: taskId ?? null,
      source: "manual",
      note: note ?? null,
      outcome: "stub",
      vapi_call_id: null,
      transcript: null,
      summary: "Stub call (VAPI not wired yet).",
      duration_seconds: null,
      started_at: new Date().toISOString(),
      ended_at: null,
    };
    fallbackCallLogs.unshift(log);
    revalidatePath("/calls");
    return { ok: true, message: "Call queued (stub) — logged to Calls." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("call_now", {
    p_employee_id: employeeId,
    p_task_id: taskId ?? null,
    p_note: note ?? null,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/calls");
  if (taskId) revalidatePath(`/tasks/${taskId}`);
  return { ok: true, message: "Call queued — the AI will reach out. See Calls for the result." };
}

export async function scheduleReminder(
  employeeId: string,
  scheduledForISO: string,
  taskId?: string | null,
  note?: string | null,
): Promise<ActionResult> {
  if (!Date.parse(scheduledForISO)) return { ok: false, message: "Invalid date/time." };
  if (!supabaseConfigured) return { ok: true, message: "Reminder scheduled (dev mode — not persisted)." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();

  const { error } = await supabase.from("reminders").insert({
    org_id: profile?.org_id ?? DEMO_ORG_ID,
    employee_id: employeeId,
    task_id: taskId ?? null,
    scheduled_for: new Date(scheduledForISO).toISOString(),
    note: note ?? null,
    source: "scheduled",
    created_by: user.id,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/calls");
  return { ok: true, message: "Reminder scheduled — the AI will call at that time." };
}

export async function cancelReminder(reminderId: string): Promise<ActionResult> {
  if (!supabaseConfigured) return { ok: true, message: "Canceled (dev mode)." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("reminders")
    .update({ status: "canceled" })
    .eq("id", reminderId)
    .eq("status", "pending");
  if (error) return { ok: false, message: error.message };
  revalidatePath("/calls");
  return { ok: true, message: "Reminder canceled." };
}

export async function updateReminderSettings(settings: {
  enabled: boolean;
  quiet_start: string;
  quiet_end: string;
  timezone: string;
}): Promise<ActionResult> {
  if (!supabaseConfigured) return { ok: true, message: "Settings saved (dev mode)." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
  const { error } = await supabase
    .from("reminder_settings")
    .upsert({ org_id: profile?.org_id ?? DEMO_ORG_ID, ...settings, updated_at: new Date().toISOString() });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/calls");
  return { ok: true, message: "Call settings saved." };
}
