import { getReminderSettings, listCallLogs, listReminders } from "@/lib/data";
import { Av, I, relativeTime } from "@/components/ui";
import { ReminderSettingsCard } from "@/components/calls/ReminderSettingsCard";
import { CancelReminderButton } from "@/components/calls/CancelReminderButton";
import { ExtractionPanel } from "@/components/calls/ExtractionPanel";
import { ExtractionTester } from "@/components/calls/ExtractionTester";
import type { CallOutcome } from "@/lib/types";

const OUTCOME: Record<CallOutcome, { c: string; label: string }> = {
  queued: { c: "var(--info)", label: "Queued" },
  ringing: { c: "var(--info)", label: "Ringing" },
  answered: { c: "var(--good)", label: "Answered" },
  "no-answer": { c: "var(--warn)", label: "No answer" },
  voicemail: { c: "var(--warn)", label: "Voicemail" },
  failed: { c: "var(--crit)", label: "Failed" },
  stub: { c: "var(--fg-3)", label: "Stub (no call)" },
};

function initials(name: string | null) {
  return (name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
function whenAbsolute(iso: string) {
  return new Date(iso).toLocaleString("en-AU", { weekday: "short", hour: "numeric", minute: "2-digit" });
}

export default async function CallsPage() {
  const [logs, reminders, settings] = await Promise.all([
    listCallLogs(),
    listReminders(),
    getReminderSettings(),
  ]);
  const upcoming = reminders.filter((r) => r.status === "pending" || r.status === "calling");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Operate</div>
          <h1 style={{ fontSize: 22 }}>AI Reminder Calls</h1>
          <p style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 8, maxWidth: 620, lineHeight: 1.5 }}>
            The AI phones employees to remind them of tasks — automatically on schedule (checked every minute)
            or manually via <b>Call now</b>. <span className="mono" style={{ color: "var(--fg-3)" }}>VAPI is stubbed for now; calls are logged but not yet dialled.</span>
          </p>
        </div>
      </div>

      <ReminderSettingsCard settings={settings} />

      <ExtractionTester />

      {/* upcoming scheduled reminders */}
      <div>
        <div className="eyebrow" style={{ fontSize: 10, marginBottom: 11 }}>Scheduled reminders ({upcoming.length})</div>
        {upcoming.length === 0 ? (
          <div className="card" style={{ padding: 18, color: "var(--fg-3)", fontSize: 13 }}>
            No reminders queued. Schedule one from a task, or use Call now anywhere.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {upcoming.map((r) => (
              <div key={r.id} className="card" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <Av initials={initials(r.employee_name)} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {r.employee_name}
                    {r.task_title && <span style={{ color: "var(--fg-3)", fontWeight: 400 }}> · {r.task_title}</span>}
                  </div>
                  {r.note && <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.note}</div>}
                </div>
                {r.status === "calling" ? (
                  <span className="chip warn" style={{ height: 20 }}><span className="dot" />Calling</span>
                ) : (
                  <span className="chip" style={{ height: 20 }}><I.clock size={11} /> {whenAbsolute(r.scheduled_for)}</span>
                )}
                {r.id !== "demo-1" && r.id !== "demo-2" && <CancelReminderButton reminderId={r.id} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* call log */}
      <div>
        <div className="eyebrow" style={{ fontSize: 10, marginBottom: 11 }}>Call log</div>
        {logs.length === 0 ? (
          <div className="card" style={{ padding: 18, color: "var(--fg-3)", fontSize: 13 }}>
            No calls yet. Press <b>Call now</b> on an employee or task, or wait for a scheduled reminder to fire.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {logs.map((c) => {
              const o = OUTCOME[c.outcome];
              return (
                <div key={c.id} className="card" style={{ padding: "13px 15px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <Av initials={initials(c.employee_name)} size={34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 540 }}>{c.employee_name ?? "Unknown"}</span>
                        <span className="chip" style={{ height: 18, fontSize: 9 }}>{c.source === "manual" ? "Manager · Call now" : "Scheduled"}</span>
                        <span className="chip" style={{ height: 18, fontSize: 9, color: o.c, borderColor: `color-mix(in oklab,${o.c} 35%,transparent)` }}><span className="dot" />{o.label}</span>
                        <span style={{ flex: 1 }} />
                        <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>{relativeTime(c.started_at)}</span>
                      </div>
                      {c.task_title && <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 3 }}>{c.task_title}</div>}
                      {c.note && <div style={{ fontSize: 12.5, color: "var(--fg-2)", marginTop: 5 }}>“{c.note}”</div>}
                      {c.summary && <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 5, lineHeight: 1.45 }}>{c.summary}</div>}
                    </div>
                  </div>
                  <ExtractionPanel
                    callLogId={c.id}
                    hasTranscript={!!(c.transcript && c.transcript.trim())}
                    extraction={c.extraction ?? null}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
