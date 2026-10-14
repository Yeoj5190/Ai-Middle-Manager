import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocation, listEmployees, listEscalations } from "@/lib/data";
import { Av, Delta, I, ScorePill, scoreColor } from "@/components/ui";
import { SEV } from "@/lib/labels";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [loc, allEmployees, escalations] = await Promise.all([
    getLocation(id),
    listEmployees(),
    listEscalations(id),
  ]);
  if (!loc) notFound();

  const team = allEmployees.filter((e) => e.location_id === id);
  const health = Math.round((loc.quality + loc.compliance) / 2);
  const hc = scoreColor(health);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <Link href="/overview" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", color: "var(--fg-2)" }}>
        <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><I.arrow size={14} /></span> Overview
      </Link>

      {/* header */}
      <div className="card" style={{ padding: 22, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 22 }}>{loc.name}</h1>
            {loc.issues > 0 ? (
              <span className="chip crit" style={{ height: 22 }}>{loc.issues} issue{loc.issues > 1 ? "s" : ""}</span>
            ) : (
              <span className="chip good" style={{ height: 22 }}><I.check size={11} sw={2.4} /> Clear</span>
            )}
          </div>
          <div className="mono" style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 6 }}>{loc.area}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="mono tnum" style={{ fontSize: 30, fontWeight: 600, color: hc }}>{health}%</div>
          <div className="eyebrow" style={{ fontSize: 9, marginTop: 2 }}>Health <Delta value={Math.abs(loc.trend) + "%"} dir={loc.trend >= 0 ? "up" : "down"} /></div>
        </div>
      </div>

      {/* stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        {([
          ["Quality", loc.quality + "%", scoreColor(loc.quality)],
          ["Compliance", loc.compliance + "%", scoreColor(loc.compliance)],
          ["Staff on shift", String(loc.staff), "var(--fg)"],
          ["Open tasks", String(loc.open), "var(--fg)"],
        ] as const).map(([l, v, c]) => (
          <div key={l} className="card" style={{ padding: 15 }}>
            <div className="mono tnum" style={{ fontSize: 22, fontWeight: 600, color: c }}>{v}</div>
            <div className="eyebrow" style={{ fontSize: 9, marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* escalations at this location */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
          <span className="eyebrow" style={{ fontSize: 10 }}>Open escalations</span>
          {escalations.length > 0 && (
            <Link href={`/escalations?location=${id}`} className="mono" style={{ fontSize: 11, color: "var(--fg-3)", textDecoration: "none" }}>View all →</Link>
          )}
        </div>
        {escalations.length === 0 ? (
          <div className="card" style={{ padding: 18, color: "var(--fg-3)", fontSize: 13 }}>No open escalations.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {escalations.map((e) => {
              const sv = SEV[e.sev];
              return (
                <Link key={e.id} href={`/escalations/${e.id}`} className="card row-link" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--fg)", borderLeft: `2px solid ${sv.c}` }}>
                  <span className="mono" style={{ fontSize: 10, color: sv.c, fontWeight: 600, width: 22 }}>{sv.code}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{e.title}</span>
                  <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>{e.when_label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* team at this location */}
      <div>
        <span className="eyebrow" style={{ fontSize: 10 }}>Team ({team.length})</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 11 }}>
          {team.map((e) => (
            <Link key={e.id} href={`/employees/${e.id}`} className="card row-link" style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "var(--fg)" }}>
              <Av initials={e.initials} size={34} online={e.status === "on-shift"} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{e.name}</div>
                <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{e.role}</div>
              </div>
              <ScorePill v={e.score} sm />
            </Link>
          ))}
        </div>
      </div>

      <style>{`.row-link:hover { background: var(--hover); }`}</style>
    </div>
  );
}
