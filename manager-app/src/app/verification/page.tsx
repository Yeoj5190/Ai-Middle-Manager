import Link from "next/link";
import { getVerificationSummary, listVerificationCalls } from "@/lib/data";
import { Av, I } from "@/components/ui";
import { READY } from "@/lib/labels";

export default async function VerificationPage() {
  const [calls, v] = await Promise.all([listVerificationCalls(), getVerificationSummary()]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Knowledge</div>
        <h1 style={{ fontSize: 22 }}>Verification Calls</h1>
      </div>

      <div className="card" style={{ padding: "14px 16px", display: "flex", gap: 11, alignItems: "flex-start", background: "var(--surface-2)" }}>
        <span style={{ width: 28, height: 28, flex: "none", borderRadius: 8, background: "var(--fg)", color: "var(--bg)", display: "grid", placeContent: "center" }}>
          <I.mic size={15} />
        </span>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--fg-2)" }}>
          The AI calls each employee for a live verbal competency check before they work solo, scoring knowledge,
          confidence and readiness — and flagging anyone who needs retraining.
        </p>
      </div>

      {v && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {([
            ["Calls today", String(v.calls_today), "var(--fg)"],
            ["Ready rate", v.ready_rate + "%", "var(--good)"],
            ["Avg confidence", v.avg_confidence + "%", "var(--fg)"],
            ["Retrain", String(v.not_ready), "var(--crit)"],
          ] as const).map(([l, val, c]) => (
            <div key={l} className="card" style={{ padding: "13px 14px", textAlign: "center" }}>
              <div className="mono tnum" style={{ fontSize: 22, fontWeight: 600, color: c }}>{val}</div>
              <div className="eyebrow" style={{ fontSize: 9, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {calls.map((c) => {
          const r = READY[c.readiness];
          return (
            <Link
              key={c.id}
              href={`/verification/${c.id}`}
              className="card row-link"
              style={{ padding: "13px 15px", display: "flex", alignItems: "center", gap: 13, textDecoration: "none", color: "var(--fg)", borderLeft: `2px solid ${r.c}` }}
            >
              <Av initials={c.initials ?? "?"} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 540 }}>{c.employee_name}</div>
                <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{c.sop} · {c.dur}</div>
              </div>
              <span className="chip" style={{ height: 20, fontSize: 10, color: r.c, borderColor: `color-mix(in oklab,${r.c} 35%,transparent)` }}>
                <span className="dot" />{r.short}
              </span>
              <span className="mono tnum" style={{ fontSize: 11.5, color: "var(--fg-3)", width: 96, textAlign: "right" }}>
                K {c.knowledge} · C {c.confidence}
              </span>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-4)", width: 70, textAlign: "right" }}>{c.when_label}</span>
              <span style={{ color: "var(--fg-4)" }}><I.arrow size={15} /></span>
            </Link>
          );
        })}
      </div>

      <style>{`.row-link:hover { background: var(--hover); }`}</style>
    </div>
  );
}
