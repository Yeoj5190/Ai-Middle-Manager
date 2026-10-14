import { I, VBars, Delta, scoreColor } from "@/components/ui";
import { EmployeeActions } from "@/components/employees/EmployeeActions";
import type { QuizRecord } from "@/lib/types";

// SOP knowledge & retention panel — ported from desktop employees.jsx.
export function KnowledgeRetention({
  rec,
  employeeId,
  employeeName,
}: {
  rec: QuizRecord | null;
  employeeId: string;
  employeeName: string;
}) {
  if (!rec) return null;
  const passed = rec.status === "pass";
  const acc = scoreColor(rec.knowledge);

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>AI Training Quiz</div>
          <h2 style={{ fontSize: 19 }}>SOP knowledge &amp; retention</h2>
        </div>
        <span className="chip" style={{ height: 24 }}>
          <I.brain size={12} /> {rec.attempts} attempt{rec.attempts > 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)", gap: 22, alignItems: "stretch" }}>
        {/* left: latest quiz */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div style={{ width: 36, height: 36, flex: "none", borderRadius: 9, background: "var(--surface)", border: "1px solid var(--border)", display: "grid", placeContent: "center" }}>
              <span style={{ color: "var(--fg-3)" }}><I.video size={17} /></span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 540 }}>{rec.sop}</div>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{rec.sop_id} · completed {rec.taken_at}</div>
            </div>
            {passed ? (
              <span className="chip good" style={{ height: 22 }}><span className="dot" />Passed</span>
            ) : (
              <span className="chip warn" style={{ height: 22 }}><span className="dot" />Needs review</span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {([
              ["Quiz score", `${rec.score}/${rec.total}`, passed ? "var(--good)" : "var(--warn)"],
              ["SOP knowledge", `${rec.knowledge}%`, acc],
              ["Missed", String(rec.missed.length), rec.missed.length ? "var(--crit)" : "var(--good)"],
            ] as const).map(([l, v, c]) => (
              <div key={l} className="card" style={{ padding: 13, background: "var(--surface)" }}>
                <div className="mono tnum" style={{ fontSize: 20, fontWeight: 600, color: c }}>{v}</div>
                <div className="eyebrow" style={{ fontSize: 9, marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>

          {rec.missed.length > 0 && (
            <div>
              <div className="eyebrow" style={{ fontSize: 9.5, marginBottom: 8 }}>Questions missed</div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {rec.missed.map((m, i) => (
                  <span key={i} className="chip crit" style={{ height: 24 }}>
                    <I.close size={11} sw={2.4} /> {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* right: retention history + recommendation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 16, background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span className="eyebrow" style={{ fontSize: 9.5 }}>Retention history</span>
              <Delta
                value={Math.abs(rec.trend[rec.trend.length - 1] - rec.trend[0]) + " pts"}
                dir={rec.trend[rec.trend.length - 1] >= rec.trend[0] ? "up" : "down"}
              />
            </div>
            <VBars data={rec.trend} labels={["4w", "3w", "2w", "now"]} h={84} color={acc} />
          </div>

          <div
            className="card"
            style={{
              padding: 16,
              background: passed ? "var(--surface)" : "var(--warn-soft)",
              border: passed ? "1px solid var(--border)" : "1px solid color-mix(in oklab, var(--warn) 30%, transparent)",
              flex: 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
              <span style={{ color: passed ? "var(--fg-2)" : "var(--warn)" }}><I.spark size={14} /></span>
              <span className="eyebrow" style={{ fontSize: 9.5 }}>AI recommendation</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--fg)" }}>{rec.rec}.</p>
            {!passed && (
              <div style={{ marginTop: 14 }}>
                <EmployeeActions
                  employeeId={employeeId}
                  employeeName={employeeName}
                  actions={[
                    { type: "refresher", label: "Send refresher", icon: "send", primary: true },
                    { type: "requiz", label: "Schedule re-quiz", icon: "replay" },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
