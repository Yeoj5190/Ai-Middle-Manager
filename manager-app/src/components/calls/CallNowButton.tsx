"use client";
import { useState, useTransition } from "react";
import { callNow } from "@/lib/actions";
import { I } from "@/components/ui";

// "Call now" — the manager's manual trigger. Routes through the same shared call
// path as the scheduler (callNow action → call_now SQL → fire_reminder).
export function CallNowButton({
  employeeId,
  employeeName,
  taskId,
  size = "sm",
  label = "Call now",
}: {
  employeeId: string;
  employeeName?: string;
  taskId?: string | null;
  size?: "sm" | "md";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  function fire() {
    setStatus(null);
    startTransition(async () => {
      const res = await callNow(employeeId, taskId ?? null, note.trim() || null);
      setStatus({ ok: res.ok, msg: res.message });
      if (res.ok) {
        setNote("");
        setOpen(false);
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
      {!open ? (
        <button
          onClick={() => { setOpen(true); setStatus(null); }}
          className={"btn" + (size === "sm" ? " btn-sm" : "")}
        >
          <I.phone size={size === "sm" ? 13 : 15} /> {label}
        </button>
      ) : (
        <div className="card" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 9, width: "min(340px, 100%)" }}>
          <div className="eyebrow" style={{ fontSize: 9 }}>
            AI call{employeeName ? ` · ${employeeName}` : ""}
          </div>
          <input
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note for the AI (e.g. “come to front desk”)"
            autoFocus
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={fire} disabled={pending} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
              <I.phone size={13} /> {pending ? "Placing…" : "Place call"}
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
