import {
  getVerificationSummary,
  listEmployees,
  listLocations,
  listStatTiles,
} from "@/lib/data";
import { Delta, MetricBar, Sparkline } from "@/components/ui";

export default async function AnalyticsPage() {
  const [tiles, locations, employees, v] = await Promise.all([
    listStatTiles(),
    listLocations(),
    listEmployees(),
    getVerificationSummary(),
  ]);

  // KPI heads: the trend metrics (compliance, quality, completion-style).
  const kpis = tiles.filter((t) => ["comp", "qual", "done", "active"].includes(t.key));
  const locBoard = [...locations]
    .map((l) => ({ name: l.name, value: Math.round((l.quality + l.compliance) / 2) }))
    .sort((a, b) => b.value - a.value);
  const workforce = [...employees]
    .sort((a, b) => b.score - a.score)
    .map((e) => ({ label: e.name, v: e.score }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Knowledge</div>
        <h1 style={{ fontSize: 22 }}>Analytics &amp; Insights</h1>
      </div>

      {/* KPI heads */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
        {kpis.map((t) => (
          <div key={t.key} className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span className="eyebrow" style={{ fontSize: 9 }}>{t.label}</span>
              {t.delta && <Delta value={t.delta} dir={t.dir} invert={t.invert} />}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
              <span className="mono tnum" style={{ fontSize: 26, fontWeight: 600 }}>{t.value}</span>
              <Sparkline data={t.spark} w={72} h={30} invert={t.invert} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 22, alignItems: "start" }}>
        {/* location leaderboard */}
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Location health</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {locBoard.map((l) => (
              <MetricBar key={l.name} label={l.name} v={l.value} />
            ))}
          </div>
        </div>

        {/* workforce leaderboard */}
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Workforce — AI performance score</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {workforce.map((w) => (
              <MetricBar key={w.label} label={w.label} v={w.v} />
            ))}
          </div>
        </div>
      </div>

      {/* verification readiness */}
      {v && (
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Knowledge verification</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
            {([
              ["Calls today", String(v.calls_today), "var(--fg)"],
              ["Ready rate", v.ready_rate + "%", "var(--good)"],
              ["Avg confidence", v.avg_confidence + "%", "var(--fg)"],
              ["Need retraining", String(v.not_ready), "var(--crit)"],
            ] as const).map(([l, val, c]) => (
              <div key={l}>
                <div className="mono tnum" style={{ fontSize: 24, fontWeight: 600, color: c }}>{val}</div>
                <div className="eyebrow" style={{ fontSize: 9, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
