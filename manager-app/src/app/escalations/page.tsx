import Link from "next/link";
import { listEscalations, listLocations } from "@/lib/data";
import { I } from "@/components/ui";
import { SEV } from "@/lib/labels";

const STATUS_CHIP: Record<string, { cls: string; label: string }> = {
  open: { cls: "", label: "Open" },
  approved: { cls: "good", label: "Approved" },
  reassigned: { cls: "", label: "Reassigned" },
  snoozed: { cls: "warn", label: "Snoozed" },
};

export default async function EscalationsPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>;
}) {
  const { location } = await searchParams;
  const [escalations, locations] = await Promise.all([listEscalations(location), listLocations()]);
  const activeLoc = locations.find((l) => l.id === location);
  const counts = {
    critical: escalations.filter((e) => e.sev === "critical").length,
    high: escalations.filter((e) => e.sev === "high").length,
    med: escalations.filter((e) => e.sev === "med").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Operate</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 22 }}>Escalations</h1>
          {activeLoc && (
            <span className="chip" style={{ height: 24 }}>
              <I.pin size={12} /> {activeLoc.name}
              <Link href="/escalations" style={{ marginLeft: 4, color: "var(--fg-3)", display: "inline-flex" }}>
                <I.close size={12} />
              </Link>
            </span>
          )}
        </div>
      </div>

      {/* severity summary */}
      <div style={{ display: "flex", gap: 10 }}>
        {(["critical", "high", "med"] as const).map((k) => (
          <div key={k} className="card" style={{ flex: 1, padding: "13px 14px", textAlign: "center" }}>
            <div className="mono tnum" style={{ fontSize: 22, fontWeight: 600, color: SEV[k].c }}>{counts[k]}</div>
            <div className="eyebrow" style={{ fontSize: 9, marginTop: 3 }}>{SEV[k].label}</div>
          </div>
        ))}
      </div>

      {/* queue */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {escalations.map((e) => {
          const sv = SEV[e.sev];
          const sc = STATUS_CHIP[e.status];
          return (
            <Link
              key={e.id}
              href={`/escalations/${e.id}`}
              className="card row-link"
              style={{ padding: 16, textDecoration: "none", color: "var(--fg)", borderLeft: `2px solid ${sv.c}`, display: "block" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                <span className="mono" style={{ fontSize: 10.5, color: sv.c, fontWeight: 600 }}>{sv.code}</span>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-4)" }}>{e.id}</span>
                {e.status !== "open" && (
                  <span className={"chip " + sc.cls} style={{ height: 19, fontSize: 9.5 }}>{sc.label}</span>
                )}
                <span style={{ flex: 1 }} />
                <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{e.when_label}</span>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 540, lineHeight: 1.3, marginBottom: 6 }}>{e.title}</div>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{e.location_name} · {e.owner_name}</div>
            </Link>
          );
        })}
        {escalations.length === 0 && (
          <div className="card" style={{ padding: 28, textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>
            No escalations{activeLoc ? ` at ${activeLoc.name}` : ""}.
          </div>
        )}
      </div>

      <style>{`.row-link:hover { background: var(--hover); }`}</style>
    </div>
  );
}
