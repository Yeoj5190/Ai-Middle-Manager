"use client";
import { useState, useTransition } from "react";
import { runCallExtraction } from "@/lib/ai/actions";
import { I } from "@/components/ui";
import type { CallExtraction, ReportedTaskStatus } from "@/lib/types";

const STATUS: Record<ReportedTaskStatus, { c: string; label: string }> = {
  done: { c: "var(--good)", label: "Done" },
  in_progress: { c: "var(--info)", label: "In progress" },
  blocked: { c: "var(--crit)", label: "Blocked" },
  not_started: { c: "var(--warn)", label: "Not started" },
};

function tri(v: boolean | null) {
  return v === null ? "—" : v ? "yes" : "no";
}

// Shows the AI's structured reading of a call (REPORTED, not verified) and a
// button to run / re-run extraction on the call's transcript.
export function ExtractionPanel({
  callLogId,
  hasTranscript,
  extraction,
}: {
  callLogId: string;
  hasTranscript: boolean;
  extraction: CallExtraction | null;
}) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function run() {
    setErr(null);
    startTransition(async () => {
      const res = await runCallExtraction(callLogId);
      if (!res.ok) setErr(res.message);
    });
  }

  if (!hasTranscript) return null;
  const st = extraction?.reported_task_status ? STATUS[extraction.reported_task_status] : null;

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: extraction ? 8 : 0 }}>
        <span style={{ width: 18, height: 18, borderRadius: 5, background: "var(--accent-soft)", color: "var(--fg)", display: "grid", placeContent: "center" }}>
          <I.brain size={11} />
        </span>
        <span className="eyebrow" style={{ fontSize: 8.5 }}>AI reading · reported from call</span>
        <span style={{ flex: 1 }} />
        <button onClick={run} disabled={pending} className="btn btn-sm btn-ghost" style={{ height: 24, color: "var(--fg-3)" }}>
          <I.spark size={12} /> {pending ? "Analyzing…" : extraction ? "Re-run" : "Run AI extraction"}
        </button>
      </div>

      {extraction && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span className="chip" style={{ height: 20, fontSize: 9.5, color: st?.c ?? "var(--fg-3)", borderColor: st ? `color-mix(in oklab,${st.c} 35%,transparent)` : "var(--border)" }}>
              <span className="dot" /> Reported: {st?.label ?? "unknown"}
            </span>
            {extraction.acknowledged === true && <span className="chip" style={{ height: 20, fontSize: 9.5 }}><I.check size={10} sw={2.4} /> Acknowledged</span>}
            {extraction.acknowledged === false && <span className="chip warn" style={{ height: 20, fontSize: 9.5 }}>Not acknowledged</span>}
            {extraction.needs_help && <span className="chip crit" style={{ height: 20, fontSize: 9.5 }}>Needs help</span>}
            {extraction.follow_up_needed && <span className="chip warn" style={{ height: 20, fontSize: 9.5 }}>Follow-up needed</span>}
          </div>
          {extraction.blocker && (
            <div style={{ fontSize: 12, color: "var(--fg-2)" }}>
              <span className="mono" style={{ fontSize: 9, color: "var(--crit)" }}>BLOCKER</span> {extraction.blocker}
            </div>
          )}
          {extraction.notes && <div style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.45 }}>{extraction.notes}</div>}
          <div className="mono" style={{ fontSize: 8.5, color: "var(--fg-4)" }}>
            {extraction.model} · ack {tri(extraction.acknowledged)} · help {tri(extraction.needs_help)} · follow-up {tri(extraction.follow_up_needed)}
          </div>
        </div>
      )}

      {err && <div className="chip crit" style={{ height: "auto", padding: "5px 9px", marginTop: 7, whiteSpace: "normal", fontSize: 10 }}>{err}</div>}
    </div>
  );
}
