import Link from "next/link";
import { notFound } from "next/navigation";
import { getVerificationCall, getVerificationTurns } from "@/lib/data";
import { Av, Delta, I, VBars, scoreColor } from "@/components/ui";
import { QUALITY, READY } from "@/lib/labels";

const KIND_LABEL: Record<string, { t: string; c: string }> = {
  coach: { t: "◆ COACHING", c: "var(--warn)" },
  challenge: { t: "◆ CHALLENGING", c: "var(--warn)" },
  advance: { t: "◆ ADVANCING", c: "var(--good)" },
};

export default async function VerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [c, turns] = await Promise.all([getVerificationCall(id), getVerificationTurns(id)]);
  if (!c) notFound();
  const r = READY[c.readiness];
  const trendDelta = c.trend.length ? c.trend[c.trend.length - 1] - c.trend[0] : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 720 }}>
      <Link href="/verification" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", color: "var(--fg-2)" }}>
        <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><I.arrow size={14} /></span> All verification calls
      </Link>

      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <Av initials={c.initials ?? "?"} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/employees/${c.employee_id}`} style={{ fontSize: 17, fontWeight: 600, color: "var(--fg)", textDecoration: "none" }}>
            {c.employee_name}
          </Link>
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{c.sop} · {c.when_label} · {c.dur}</div>
        </div>
        <span className="chip" style={{ height: 26, color: r.c, borderColor: `color-mix(in oklab,${r.c} 40%,transparent)`, background: `color-mix(in oklab,${r.c} 12%,transparent)` }}>
          <span className="dot" />{r.short}
        </span>
      </div>

      {/* recording player (visual) */}
      <div className="card" style={{ padding: "12px 15px", display: "flex", alignItems: "center", gap: 13, background: "var(--surface-2)" }}>
        <span style={{ width: 34, height: 34, flex: "none", borderRadius: 99, background: "var(--fg)", color: "var(--bg)", display: "grid", placeContent: "center" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </span>
        <div style={{ flex: 1, display: "flex", gap: 2, alignItems: "center", height: 28 }}>
          {Array.from({ length: 56 }).map((_, i) => (
            <span key={i} style={{ flex: 1, minWidth: 1.5, borderRadius: 2, height: `${20 + Math.abs(Math.sin(i)) * 60}%`, background: i < 18 ? "var(--fg)" : "var(--border-strong)" }} />
          ))}
        </div>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{c.dur}</span>
      </div>

      {/* scores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {([
          ["Knowledge", c.knowledge + "%", scoreColor(c.knowledge)],
          ["Confidence", c.confidence + "%", scoreColor(c.confidence)],
          ["Readiness", r.short, r.c],
        ] as const).map(([l, val, col]) => (
          <div key={l} className="card" style={{ padding: 14, textAlign: "center" }}>
            <div className="mono tnum" style={{ fontSize: l === "Readiness" ? 14 : 22, fontWeight: 600, color: col, marginTop: l === "Readiness" ? 5 : 0 }}>{val}</div>
            <div className="eyebrow" style={{ fontSize: 8.5, marginTop: 5 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* AI assessment */}
      <div className="card" style={{ padding: 16, background: "var(--surface-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
          <span style={{ color: "var(--fg-2)" }}><I.spark size={14} /></span>
          <span className="eyebrow" style={{ fontSize: 9 }}>AI assessment</span>
        </div>
        <p style={{ margin: "0 0 11px", fontSize: 13, lineHeight: 1.5, color: "var(--fg-2)" }}>{c.summary}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {c.flags.map((f, i) => {
            const crit = /alert|failed|twice/i.test(f);
            return (
              <span key={i} className="chip" style={{ height: 22, fontSize: 10, color: crit ? "var(--crit)" : "var(--fg-2)" }}>{f}</span>
            );
          })}
        </div>
      </div>

      {/* improvement */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span className="eyebrow" style={{ fontSize: 9 }}>Improvement · knowledge</span>
          <Delta value={Math.abs(trendDelta) + " pts"} dir={trendDelta >= 0 ? "up" : "down"} />
        </div>
        <VBars data={c.trend} labels={["4w", "3w", "2w", "now"]} h={88} color={scoreColor(c.knowledge)} />
      </div>

      {/* transcript */}
      {turns.length > 0 && (
        <div>
          <div className="eyebrow" style={{ fontSize: 9, marginBottom: 11 }}>Transcript · AI annotations</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {turns.map((t, i) => {
              if (t.who === "ai") {
                const k = t.kind && t.kind !== "verdict" ? KIND_LABEL[t.kind] : null;
                return (
                  <div key={i} style={{ fontSize: 13, lineHeight: 1.45, color: "var(--fg)", maxWidth: "88%" }}>
                    {t.tag && <div className="mono" style={{ fontSize: 9, color: "var(--fg-4)", marginBottom: 3, letterSpacing: ".04em" }}>{t.tag}</div>}
                    {k && <div className="mono" style={{ fontSize: 8.5, color: k.c, marginBottom: 3, letterSpacing: ".04em" }}>{k.t}</div>}
                    <div style={{ padding: "9px 12px", borderRadius: "4px 12px 12px 12px", background: "var(--surface-2)", border: "1px solid var(--border)" }}>{t.body}</div>
                  </div>
                );
              }
              const ql = QUALITY[t.quality ?? "partial"] ?? QUALITY.partial;
              return (
                <div key={i} style={{ alignSelf: "flex-end", maxWidth: "84%" }}>
                  <div style={{ fontSize: 13, lineHeight: 1.4, color: "var(--bg)", background: "var(--fg)", padding: "9px 12px", borderRadius: "12px 4px 12px 12px" }}>{t.body}</div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                    {t.hesitation && <span className="mono" style={{ fontSize: 8.5, color: "var(--warn)" }}>hesitation</span>}
                    <span className="mono" style={{ fontSize: 8.5, color: ql.c }}>{ql.l}</span>
                    {t.confidence != null && <span className="mono tnum" style={{ fontSize: 8.5, color: "var(--fg-3)" }}>{Math.round(t.confidence * 100)}%</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* action */}
      {c.readiness === "ready" ? (
        <div className="chip good" style={{ height: 42, width: "100%", justifyContent: "center", boxSizing: "border-box" }}>
          <I.check size={14} sw={2.4} /> Cleared to work independently{c.follow ? ` · ${c.follow}-day follow-up` : ""}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/employees/${c.employee_id}`} className="btn btn-primary" style={{ flex: 1, height: 46, justifyContent: "center" }}>
            <I.send size={15} /> Send retraining
          </Link>
          <button className="btn" style={{ height: 46, width: 120, justifyContent: "center" }}>Re-call</button>
        </div>
      )}
    </div>
  );
}
