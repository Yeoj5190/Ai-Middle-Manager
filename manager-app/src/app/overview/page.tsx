import Link from "next/link";
import {
  getBriefing,
  getCurrentUser,
  getVerificationSummary,
  listInsights,
  listLocations,
  listStatTiles,
} from "@/lib/data";
import { Av, Delta, I, Sparkline, scoreColor } from "@/components/ui";

const INSIGHT_STYLE = {
  crit: { c: "var(--crit)", icon: "spark" as const },
  warn: { c: "var(--warn)", icon: "spark" as const },
  good: { c: "var(--good)", icon: "check" as const },
};

// Each live-ops tile drills into the surface it summarizes.
const TILE_HREF: Record<string, string> = {
  active: "/employees",
  open: "/tasks",
  done: "/tasks",
  esc: "/escalations",
  comp: "/analytics",
  qual: "/analytics",
};

// Map the seeded insight action labels to a destination (production: store a
// structured target on the insight row instead of matching on the label).
const INSIGHT_HREF: Record<string, string> = {
  "Open Granville": "/locations/gran",
  "View Bianca": "/employees/bianca",
  "View escalations": "/escalations",
  "View analytics": "/analytics",
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening";
}

export default async function OverviewPage() {
  const [user, briefing, tiles, insights, verification, locations] = await Promise.all([
    getCurrentUser(),
    getBriefing(),
    listStatTiles(),
    listInsights(),
    getVerificationSummary(),
    listLocations(),
  ]);

  const firstName = user.name.split(" ")[0];
  const dateLabel = new Date().toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* greeting */}
      <div>
        <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
          {dateLabel} · {locations.length} locations · 26 staff
        </div>
        <h1 style={{ fontSize: 25, marginTop: 6, letterSpacing: "-.02em" }}>{greeting()}, {firstName}.</h1>
      </div>

      {/* AI briefing */}
      {briefing && (
        <div className="card" style={{ padding: 22, position: "relative", overflow: "hidden" }}>
          <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.5, maskImage: "radial-gradient(120% 100% at 100% 0%, black, transparent 70%)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
              <span style={{ width: 24, height: 24, borderRadius: 7, background: "var(--fg)", color: "var(--bg)", display: "grid", placeContent: "center" }}>
                <I.spark size={14} />
              </span>
              <span className="eyebrow" style={{ fontSize: 10 }}>AI Operations Briefing</span>
              <span className="chip good" style={{ height: 19, fontSize: 10, marginLeft: "auto" }}><span className="dot" />Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: "var(--fg)", maxWidth: 820 }}>{briefing.body}</p>
            {briefing.stamp && (
              <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-4)", marginTop: 12 }}>{briefing.stamp}</div>
            )}
          </div>
        </div>
      )}

      {/* live-ops tiles */}
      <div>
        <div className="eyebrow" style={{ fontSize: 10, marginBottom: 11 }}>Live operations</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          {tiles.map((s) => (
            <Link key={s.key} href={TILE_HREF[s.key] ?? "#"} className="card row-link" style={{ padding: 15, display: "block", textDecoration: "none", color: "var(--fg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span className="eyebrow" style={{ fontSize: 9 }}>{s.label}</span>
                {s.delta && <Delta value={s.delta} dir={s.dir} invert={s.invert} />}
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div className="mono tnum" style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.02em" }}>{s.value}</div>
                  {s.sub && <div className="mono" style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 3 }}>{s.sub}</div>}
                </div>
                <Sparkline data={s.spark} w={64} h={28} invert={s.invert} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* what needs you + verification */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 22, alignItems: "start" }}>
        {/* insights */}
        <div>
          <div className="eyebrow" style={{ fontSize: 10, marginBottom: 11 }}>What needs you</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {insights.slice(0, 4).map((ins) => {
              const m = INSIGHT_STYLE[ins.sev];
              const Icon = I[m.icon];
              const href = ins.action_label ? INSIGHT_HREF[ins.action_label] : undefined;
              const inner = (
                <>
                  <span style={{ width: 28, height: 28, flex: "none", borderRadius: 8, display: "grid", placeContent: "center", background: `color-mix(in oklab, ${m.c} 14%, transparent)`, color: m.c }}>
                    <Icon size={15} />
                  </span>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.45, color: "var(--fg-2)", flex: 1 }}>{ins.body}</p>
                  {ins.action_label && (
                    <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)", whiteSpace: "nowrap" }}>{ins.action_label} →</span>
                  )}
                </>
              );
              return href ? (
                <Link key={ins.id} href={href} className="card row-link" style={{ padding: 15, display: "flex", gap: 12, alignItems: "flex-start", textDecoration: "none", color: "var(--fg)" }}>
                  {inner}
                </Link>
              ) : (
                <div key={ins.id} className="card" style={{ padding: 15, display: "flex", gap: 12, alignItems: "flex-start" }}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>

        {/* knowledge verification */}
        {verification && (
          <div>
            <div className="eyebrow" style={{ fontSize: 10, marginBottom: 11 }}>Knowledge verification</div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <Link href="/verification" className="row-link" style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 15px", borderBottom: "1px solid var(--border)", textDecoration: "none", color: "var(--fg)" }}>
                <span style={{ width: 26, height: 26, flex: "none", borderRadius: 7, background: "var(--fg)", color: "var(--bg)", display: "grid", placeContent: "center" }}>
                  <I.brain size={14} />
                </span>
                <span style={{ fontSize: 13, fontWeight: 540, flex: 1 }}>AI verbal checks</span>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{verification.calls_today} today →</span>
              </Link>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
                {([
                  ["Ready rate", verification.ready_rate + "%", "var(--good)"],
                  ["Avg conf.", verification.avg_confidence + "%", "var(--fg)"],
                  ["Retrain", String(verification.not_ready), "var(--crit)"],
                ] as const).map(([l, v, c], i) => (
                  <div key={l} style={{ padding: "14px 14px", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
                    <div className="mono tnum" style={{ fontSize: 20, fontWeight: 600, color: c }}>{v}</div>
                    <div className="eyebrow" style={{ fontSize: 8.5, marginTop: 3 }}>{l}</div>
                  </div>
                ))}
              </div>
              {verification.not_ready_employee_id && (
                <Link
                  href={`/verification/${verification.not_ready_employee_id}`}
                  style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 15px", borderTop: "1px solid var(--border)", background: "var(--crit-soft)", textDecoration: "none", color: "var(--fg)" }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5 }}>
                      <b>{verification.not_ready_sop}</b> flagged
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>1 employee not ready · retraining alerted</div>
                  </div>
                  <span className="mono tnum" style={{ fontSize: 13, fontWeight: 600, color: "var(--crit)" }}>{verification.not_ready_knowledge}</span>
                  <span style={{ color: "var(--crit)" }}><I.arrow size={15} /></span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* location health */}
      <div>
        <div className="eyebrow" style={{ fontSize: 10, marginBottom: 11 }}>Location health</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {locations.map((l) => {
            const health = Math.round((l.quality + l.compliance) / 2);
            const hc = scoreColor(health);
            return (
              <Link key={l.id} href={`/locations/${l.id}`} className="card row-link" style={{ padding: 15, display: "block", textDecoration: "none", color: "var(--fg)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 11 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 540, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 2 }}>{l.area}</div>
                  </div>
                  {l.issues > 0 ? (
                    <span className="chip crit" style={{ height: 20 }}>{l.issues} issue{l.issues > 1 ? "s" : ""}</span>
                  ) : (
                    <span className="chip good" style={{ height: 20 }}><I.check size={11} sw={2.4} /></span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: hc }} />
                  <span className="mono tnum" style={{ fontSize: 12, color: "var(--fg-2)" }}>{health}% health</span>
                  <span style={{ flex: 1 }} />
                  <Delta value={Math.abs(l.trend) + "%"} dir={l.trend >= 0 ? "up" : "down"} />
                </div>
                <div className="meter"><i style={{ width: `${health}%`, background: hc }} /></div>
                <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--fg-3)", marginTop: 11 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <I.users size={12} /><b className="mono tnum" style={{ color: "var(--fg-2)" }}>{l.staff}</b> on shift
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <I.clock size={12} /><b className="mono tnum" style={{ color: "var(--fg-2)" }}>{l.open}</b> open
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <style>{`.row-link:hover { background: var(--hover); }`}</style>
    </div>
  );
}
