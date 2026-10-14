// Server-side data access for the employee-management slice.
//
// Two paths behind one interface:
//   • Supabase configured  → real Postgres reads, scoped by RLS to the user's org.
//   • dev-fallback (no env) → src/data/seed.json in memory.
//
// Swapping window.AMM reads for these functions is exactly the prototype→prod
// move described in the README (§10).
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { seed } from "@/lib/seed";
import {
  fallbackEvents,
  fallbackEscStatus,
  fallbackTaskTimeline,
  fallbackCallLogs,
} from "@/lib/fallback-store";
import type {
  Briefing,
  EmployeeEvent,
  EmployeeWithLocation,
  EscalationDetail,
  Insight,
  Location,
  QuizRecord,
  Role,
  StatTile,
  TaskDetail,
  TaskDetailDoc,
  TaskFull,
  TimelineEntry,
  VerificationCallDetail,
  VerificationSummary,
  VerificationTurn,
  CallLogWithNames,
  CallExtraction,
  ReminderWithNames,
  ReminderSettings,
} from "@/lib/types";

const locName = (id: string | null) =>
  seed.locations.find((l) => l.id === id)?.name ?? null;
const emp = (id: string | null) => seed.employees.find((e) => e.id === id) ?? null;

// ── current user (for the topbar + action attribution) ──────────────────────
export interface CurrentUser {
  id: string | null;
  name: string;
  role: Role;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  if (!supabaseConfigured) {
    return { id: null, name: "John Mercer", role: "ops_manager" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { id: null, name: "Manager", role: "ops_manager" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    name: profile?.full_name ?? user.email ?? "Manager",
    role: (profile?.role as Role) ?? "ops_manager",
  };
}

// ── employees ───────────────────────────────────────────────────────────────
export async function listEmployees(): Promise<EmployeeWithLocation[]> {
  if (!supabaseConfigured) {
    return seed.employees.map((e) => ({
      ...e,
      phone: seed.phones?.[e.id] ?? null,
      location_name: locName(e.location_id),
    }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*, locations(name)")
    .order("score", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const { locations, ...emp } = row as typeof row & {
      locations: { name: string } | null;
    };
    return { ...(emp as EmployeeWithLocation), location_name: locations?.name ?? null };
  });
}

export async function getEmployee(
  id: string,
): Promise<EmployeeWithLocation | null> {
  if (!supabaseConfigured) {
    const e = seed.employees.find((x) => x.id === id);
    return e ? { ...e, phone: seed.phones?.[e.id] ?? null, location_name: locName(e.location_id) } : null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*, locations(name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const { locations, ...emp } = data as typeof data & {
    locations: { name: string } | null;
  };
  return { ...(emp as EmployeeWithLocation), location_name: locations?.name ?? null };
}

// ── quiz record ─────────────────────────────────────────────────────────────
export async function getQuizRecord(
  employeeId: string,
): Promise<QuizRecord | null> {
  if (!supabaseConfigured) {
    return seed.quiz_records.find((r) => r.employee_id === employeeId) ?? null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quiz_records")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as QuizRecord | null) ?? null;
}

// ── coaching timeline + persisted manager actions ───────────────────────────
export async function listEvents(employeeId: string): Promise<EmployeeEvent[]> {
  if (!supabaseConfigured) {
    const seeded: EmployeeEvent[] = seed.events
      .filter((e) => e.employee_id === employeeId)
      .map((e, i) => {
        const created = new Date(
          Date.now() - (e.days_ago * 24 + e.hours_ago) * 3600_000,
        ).toISOString();
        return {
          id: `seed-${employeeId}-${i}`,
          employee_id: e.employee_id,
          actor_id: null,
          kind: "coaching",
          action_type: null,
          channel: e.channel,
          good: e.good,
          body: e.body,
          created_at: created,
        };
      });
    return [...fallbackEvents.filter((e) => e.employee_id === employeeId), ...seeded].sort(
      (a, b) => b.created_at.localeCompare(a.created_at),
    );
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_events")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as EmployeeEvent[]) ?? [];
}

// ── Overview (manager home) ──────────────────────────────────────────────────
export async function listLocations(): Promise<Location[]> {
  if (!supabaseConfigured) return seed.locations;
  const supabase = await createClient();
  const { data, error } = await supabase.from("locations").select("*").order("name");
  if (error) throw new Error(error.message);
  return (data as Location[]) ?? [];
}

export async function getLocation(id: string): Promise<Location | null> {
  if (!supabaseConfigured) return seed.locations.find((l) => l.id === id) ?? null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("locations").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Location | null) ?? null;
}

export async function getBriefing(): Promise<Briefing | null> {
  if (!supabaseConfigured) return seed.briefing;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("briefings")
    .select("body, stamp")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Briefing | null) ?? null;
}

export async function listStatTiles(): Promise<StatTile[]> {
  if (!supabaseConfigured) return seed.stat_tiles;
  const supabase = await createClient();
  const { data, error } = await supabase.from("stat_tiles").select("*").order("sort");
  if (error) throw new Error(error.message);
  return (data as StatTile[]) ?? [];
}

export async function listInsights(): Promise<Insight[]> {
  if (!supabaseConfigured) {
    return seed.insights.map((i, idx) => ({ ...i, id: `seed-insight-${idx}` }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("insights").select("*").order("sort");
  if (error) throw new Error(error.message);
  return (data as Insight[]) ?? [];
}

export async function getVerificationSummary(): Promise<VerificationSummary | null> {
  if (!supabaseConfigured) return seed.verification;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("verification_summary")
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as VerificationSummary | null) ?? null;
}

// ── escalations ──────────────────────────────────────────────────────────────
const SEV_RANK = { critical: 0, high: 1, med: 2 } as const;

export async function listEscalations(locationId?: string): Promise<EscalationDetail[]> {
  if (!supabaseConfigured) {
    return seed.escalations
      .filter((e) => !locationId || e.location_id === locationId)
      .map((e) => {
        const o = emp(e.owner_employee_id);
        return {
          ...e,
          status: fallbackEscStatus[e.id] ?? e.status,
          location_name: locName(e.location_id),
          owner_name: o?.name ?? null,
          owner_initials: o?.initials ?? null,
        };
      })
      .sort((a, b) => SEV_RANK[a.sev] - SEV_RANK[b.sev]);
  }
  const supabase = await createClient();
  let query = supabase
    .from("escalations")
    .select("*, locations(name), employees!owner_employee_id(name, initials)");
  if (locationId) query = query.eq("location_id", locationId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row) => {
      const { locations, employees, ...e } = row as typeof row & {
        locations: { name: string } | null;
        employees: { name: string; initials: string } | null;
      };
      return {
        ...(e as EscalationDetail),
        location_name: locations?.name ?? null,
        owner_name: employees?.name ?? null,
        owner_initials: employees?.initials ?? null,
      };
    })
    .sort((a, b) => SEV_RANK[a.sev] - SEV_RANK[b.sev]);
}

export async function getEscalation(id: string): Promise<EscalationDetail | null> {
  const all = await listEscalations();
  return all.find((e) => e.id === id) ?? null;
}

// ── tasks ────────────────────────────────────────────────────────────────────
export async function listTasks(): Promise<TaskDetail[]> {
  if (!supabaseConfigured) {
    return seed.tasks.map((t) => ({
      ...t,
      location_name: locName(t.location_id),
      assignee_name: emp(t.assignee_employee_id)?.name ?? null,
    }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, locations(name), employees!assignee_employee_id(name)");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const { locations, employees, ...t } = row as typeof row & {
      locations: { name: string } | null;
      employees: { name: string } | null;
    };
    return { ...(t as TaskDetail), location_name: locations?.name ?? null, assignee_name: employees?.name ?? null };
  });
}

// Assemble the full investigation view: base task + joined names + the detail
// document, with sensible synthesized defaults so every task opens coherently.
function buildTaskFull(base: TaskDetail, doc: TaskDetailDoc): TaskFull {
  const origin: "ai" | "manual" =
    base.source === "AI generated" ||
    (doc.created_by ?? "").includes("AI") ||
    (doc.ai_detected?.length ?? 0) > 0
      ? "ai"
      : "manual";
  const assignee = base.assignee_name ?? "the assignee";
  const created = doc.created_at_label ?? "Today 08:00 AM";
  const escalation =
    doc.escalation_level ??
    (base.priority === "high" && (base.status === "overdue" || base.status === "review") ? "med" : "none");

  const synthTimeline: TimelineEntry[] = [
    { at: created, actor: origin === "ai" ? "AI" : "Manager", body: `${origin === "ai" ? "AI created" : "Manager created"} task` },
    { at: created, actor: "AI", body: `Assigned to ${assignee}` },
    ...(base.status !== "todo" ? [{ at: "—", actor: "Employee" as const, body: "Employee viewed task" }] : []),
    ...(base.status === "in-progress" ? [{ at: "—", actor: "Employee" as const, body: "Marked in progress" }] : []),
    ...(base.status === "review" ? [{ at: "—", actor: "AI" as const, body: "Submitted for verification — awaiting sign-off" }] : []),
    ...(base.status === "done" ? [{ at: "—", actor: "AI" as const, body: "Task completed and verified" }] : []),
    ...(base.status === "overdue" ? [{ at: "—", actor: "AI" as const, body: "Flagged overdue — past due time" }] : []),
  ];

  const fromBase = base.source ? `Source: ${base.source}.` : "";
  return {
    ...base,
    origin,
    created_at_label: created,
    created_by: doc.created_by ?? (origin === "ai" ? "AI Operations Manager" : "Operations Manager"),
    reason: doc.reason ?? (origin === "ai" ? `${base.source} — auto-generated from operational signals.` : null),
    completion_deadline: doc.completion_deadline ?? base.due_label,
    escalation_level: escalation,
    description: doc.description ?? `${base.title} at ${base.location_name ?? "the site"}. ${fromBase}`.trim(),
    sop_id: doc.sop_id ?? null,
    sop_title: doc.sop_title ?? null,
    training_title: doc.training_title ?? null,
    equipment: doc.equipment ?? [],
    quality_standard: doc.quality_standard ?? null,
    verification_required: doc.verification_required ?? base.status === "review",
    time_spent: doc.time_spent ?? null,
    ai_confidence: doc.ai_confidence ?? null,
    sop_adherence: doc.sop_adherence ?? null,
    ai_detected: doc.ai_detected ?? [],
    ai_recommendation: doc.ai_recommendation ?? null,
    timeline: [...(doc.timeline ?? synthTimeline), ...(fallbackTaskTimeline[base.id] ?? [])],
    checklist: doc.checklist ?? [],
    media: doc.media ?? [],
    inspection_checks: doc.inspection_checks ?? [],
    activity: doc.activity ?? [],
    ai_insights: doc.ai_insights ?? [],
  };
}

export async function getTask(id: string): Promise<TaskFull | null> {
  if (!supabaseConfigured) {
    const raw = seed.tasks.find((t) => t.id === id);
    if (!raw) return null;
    const base: TaskDetail = {
      id: raw.id,
      location_id: raw.location_id,
      title: raw.title,
      assignee_employee_id: raw.assignee_employee_id,
      priority: raw.priority,
      status: raw.status,
      due_label: raw.due_label,
      source: raw.source,
      location_name: locName(raw.location_id),
      assignee_name: emp(raw.assignee_employee_id)?.name ?? null,
    };
    return buildTaskFull(base, raw.detail ?? {});
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, locations(name), employees!assignee_employee_id(name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const { locations, employees, detail, ...t } = data as typeof data & {
    locations: { name: string } | null;
    employees: { name: string } | null;
    detail: TaskDetailDoc | null;
  };
  const base: TaskDetail = {
    ...(t as TaskDetail),
    location_name: locations?.name ?? null,
    assignee_name: employees?.name ?? null,
  };
  return buildTaskFull(base, detail ?? {});
}

// ── verification calls ───────────────────────────────────────────────────────
export async function listVerificationCalls(): Promise<VerificationCallDetail[]> {
  if (!supabaseConfigured) {
    return seed.verification_calls.map((c) => {
      const e = emp(c.employee_id);
      return { ...c, employee_name: e?.name ?? null, initials: e?.initials ?? null };
    });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("verification_calls")
    .select("*, employees!employee_id(name, initials)");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const { employees, ...c } = row as typeof row & {
      employees: { name: string; initials: string } | null;
    };
    return { ...(c as VerificationCallDetail), employee_name: employees?.name ?? null, initials: employees?.initials ?? null };
  });
}

export async function getVerificationCall(id: string): Promise<VerificationCallDetail | null> {
  const all = await listVerificationCalls();
  return all.find((c) => c.id === id) ?? null;
}

export async function getVerificationTurns(callId: string): Promise<VerificationTurn[]> {
  if (!supabaseConfigured) {
    return seed.verification_turns
      .filter((t) => t.call_id === callId)
      .sort((a, b) => a.ord - b.ord)
      .map(({ call_id, ...t }) => t);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("verification_turns")
    .select("ord, who, body, tag, kind, confidence, quality, hesitation")
    .eq("call_id", callId)
    .order("ord");
  if (error) throw new Error(error.message);
  return (data as VerificationTurn[]) ?? [];
}

// ── AI reminder calls ────────────────────────────────────────────────────────
const empName = (id: string | null) => seed.employees.find((e) => e.id === id)?.name ?? null;
const taskTitle = (id: string | null) => seed.tasks.find((t) => t.id === id)?.title ?? null;

export async function getReminderSettings(): Promise<ReminderSettings> {
  if (!supabaseConfigured) return { org_id: "demo", ...seed.reminder_settings };
  const supabase = await createClient();
  const { data, error } = await supabase.from("reminder_settings").select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ReminderSettings) ?? { org_id: "", ...seed.reminder_settings };
}

export async function listReminders(): Promise<ReminderWithNames[]> {
  if (!supabaseConfigured) {
    // synthesize the demo reminders the seed script creates against the real DB
    return [
      { id: "demo-1", employee_id: "jamal", task_id: "T-4829", scheduled_for: new Date(Date.now() - 60_000).toISOString(), note: "Re-clean Room 12 and re-submit photos.", source: "scheduled", status: "pending", attempts: 0, created_at: new Date().toISOString(), employee_name: empName("jamal"), task_title: taskTitle("T-4829") },
      { id: "demo-2", employee_id: "marcus", task_id: "T-4822", scheduled_for: new Date(Date.now() + 45 * 60_000).toISOString(), note: "HVAC repair in Room 4.", source: "scheduled", status: "pending", attempts: 0, created_at: new Date().toISOString(), employee_name: empName("marcus"), task_title: taskTitle("T-4822") },
    ];
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select("*, employees!employee_id(name), tasks!task_id(title)")
    .order("scheduled_for", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const { employees, tasks, ...r } = row as typeof row & {
      employees: { name: string } | null;
      tasks: { title: string } | null;
    };
    return { ...(r as ReminderWithNames), employee_name: employees?.name ?? null, task_title: tasks?.title ?? null };
  });
}

export async function listCallLogs(): Promise<CallLogWithNames[]> {
  if (!supabaseConfigured) {
    return [...fallbackCallLogs]
      .sort((a, b) => b.started_at.localeCompare(a.started_at))
      .map((c) => ({ ...c, employee_name: empName(c.employee_id), task_title: taskTitle(c.task_id) }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("call_logs")
    .select("*, employees!employee_id(name), tasks!task_id(title), call_extractions(*)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const { employees, tasks, call_extractions, ...c } = row as typeof row & {
      employees: { name: string } | null;
      tasks: { title: string } | null;
      call_extractions: CallExtraction[] | null;
    };
    const extraction =
      (call_extractions ?? [])
        .slice()
        .sort((a: CallExtraction, b: CallExtraction) => b.created_at.localeCompare(a.created_at))[0] ?? null;
    return {
      ...(c as CallLogWithNames),
      employee_name: employees?.name ?? null,
      task_title: tasks?.title ?? null,
      extraction,
    };
  });
}
