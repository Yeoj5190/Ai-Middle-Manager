"use client";
import { useState, useTransition } from "react";
import { runSampleExtraction } from "@/lib/ai/actions";
import { I } from "@/components/ui";
import type { ExtractedOutcome } from "@/lib/types";

const SAMPLE =
  "AI: Hi Marcus, reminder about the HVAC repair in room 4 — the guest checks in at 3.\n" +
  "Marcus: Yeah I know, but I can't do it. The replacement condenser fan hasn't arrived and I don't have the right wrench on site.\n" +
  "AI: Do you need help getting those?\n" +
  "Marcus: Yeah, can someone bring the backup unit from Greystanes? I'm stuck until then.\n" +
  "AI: I'll flag that. Thanks Marcus.";

// Ad-hoc tester: paste any transcript, see the structured extraction (does not
// persist). Lets you exercise the AI brain before real calls exist.
export function ExtractionTester() {
  const [text, setText] = useState(SAMPLE);
  const [pending, startTransition] = useTransition();
  const [outcome, setOutcome] = useState<ExtractedOutcome | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function run() {
    setErr(null);
    setOutcome(null);
    startTransition(async () => {
      const res = await runSampleExtraction(text);
      if (res.ok && res.outcome) {
        setOutcome(res.outcome);
        setModel(res.model ?? null);
      } else setErr(res.message);
    });
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ width: 22, height: 22, borderRadius: 7, background: "var(--fg)", color: "var(--bg)", display: "grid", placeContent: "center" }}>
          <I.brain size={13} />
        </span>
        <div>
          <div className="eyebrow" style={{ fontSize: 9.5 }}>AI brain · test extraction</div>
          <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>Paste a transcript → structured outcome (reported, not verified). Not saved.</div>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="input"
        style={{ height: "auto", padding: 11, fontFamily: "var(--font-mono)", fontSize: 11.5, lineHeight: 1.5, resize: "vertical" }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
        <button onClick={run} disabled={pending} className="btn btn-primary btn-sm">
          <I.spark size={13} /> {pending ? "Analyzing…" : "Extract"}
        </button>
        {model && <span className="mono" style={{ fontSize: 10, color: "var(--fg-4)" }}>{model}</span>}
      </div>

      {err && <div className="chip crit" style={{ height: "auto", padding: "7px 10px", marginTop: 10, whiteSpace: "normal" }}>{err}</div>}

      {outcome && (
        <div className="card fade-up" style={{ padding: 14, marginTop: 12, background: "var(--surface-2)" }}>
          <div className="eyebrow" style={{ fontSize: 9, marginBottom: 9 }}>Structured outcome</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 10, fontSize: 12.5 }}>
            {([
              ["reported_task_status", outcome.reported_task_status],
              ["acknowledged", outcome.acknowledged],
              ["needs_help", outcome.needs_help],
              ["follow_up_needed", outcome.follow_up_needed],
            ] as const).map(([k, v]) => (
              <div key={k}>
                <div className="mono" style={{ fontSize: 9, color: "var(--fg-4)" }}>{k}</div>
                <div className="mono" style={{ color: v === null ? "var(--fg-4)" : "var(--fg)" }}>{v === null ? "null" : String(v)}</div>
              </div>
            ))}
          </div>
          {(["blocker", "notes"] as const).map((k) => (
            <div key={k} style={{ marginTop: 10 }}>
              <div className="mono" style={{ fontSize: 9, color: "var(--fg-4)" }}>{k}</div>
              <div style={{ fontSize: 12.5, color: outcome[k] === null ? "var(--fg-4)" : "var(--fg-2)", lineHeight: 1.45 }}>
                {outcome[k] === null ? "null" : outcome[k]}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
