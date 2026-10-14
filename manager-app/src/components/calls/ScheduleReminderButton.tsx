"use client";
import { useState, useTransition } from "react";
import { scheduleReminder } from "@/lib/actions";
import { I } from "@/components/ui";

// Schedule an AI reminder call for this task's assignee at a chosen time.
export function ScheduleReminderButton({
  employeeId,
  taskId,
  defaultNote,
}: {
  employeeId: string;
  taskId?: string | null;
  defaultNote?: string;
}) {
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState("");
  const [note, setNote] = useState(defaultNote ?? "");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  function submit() {
    if (!when) {
      setStatus({ ok: false, msg: "Pick a date and time." });
      return;
    }
    setStatus(null);
    startTransition(async () => {
      // datetime-local is local time; convert to ISO
      const iso = new Date(when).toISOString();
      const res = await scheduleReminder(employeeId, iso, taskId ?? null, note.trim() || null);
      setStatus({ ok: res.ok, msg: res.message });
      if (res.ok) setOpen(false);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
      {!open ? (
        <button onClick={() => { setOpen(true); setStatus(null); }} className="btn btn-sm">
          <I.calendar size={13} /> Schedule reminder
        </button>
      ) : (
        <div className="card" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 9, width: "min(360px, 100%)" }}>
          <div className="eyebrow" style={{ fontSize: 9 }}>Schedule AI reminder call</div>
          <input className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the AI (optional)" />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={submit} disabled={pending} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
              {pending ? "Scheduling…" : "Schedule"}
            </button>
            <button onClick={() => setOpen(false)} disabled={pending} className="btn btn-sm">Cancel</button>
          </div>
        </div>
      )}
      {status && (
        <div className={"chip " + (status.ok ? "good" : "crit") + " fade-up"} style={{ height: "auto", padding: "7px 11px", whiteSpace: "normal", lineHeight: 1.4 }}>
          {status.ok ? <I.check size={12} sw={2.4} /> : null} {status.msg}
        </div>
      )}
    </div>
  );
}
