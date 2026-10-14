import Link from "next/link";
import { notFound } from "next/navigation";
import { getEscalation } from "@/lib/data";
import { Av, I } from "@/components/ui";
import { SEV } from "@/lib/labels";
import { EscalationActions } from "@/components/escalations/EscalationActions";

export default async function EscalationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const e = await getEscalation(id);
  if (!e) notFound();
  const sv = SEV[e.sev];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 720 }}>
      <Link href="/escalations" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", color: "var(--fg-2)" }}>
        <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><I.arrow size={14} /></span> All escalations
      </Link>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <span className="chip" style={{ color: sv.c, borderColor: `color-mix(in oklab,${sv.c} 40%,transparent)`, background: `color-mix(in oklab,${sv.c} 14%,transparent)`, height: 24 }}>
            <span className="dot" /> {sv.code} · {e.sev}
          </span>
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-4)" }}>{e.id}</span>
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{e.when_label}</span>
        </div>
        <h1 style={{ fontSize: 22, lineHeight: 1.25 }}>{e.title}</h1>
        <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: "var(--fg-2)", marginTop: 10, flexWrap: "wrap" }}>
          <Link href={`/escalations?location=${e.location_id}`} style={{ display: "flex", gap: 5, alignItems: "center", color: "var(--fg-2)", textDecoration: "none" }}>
            <span style={{ color: "var(--fg-3)" }}><I.pin size={14} /></span>{e.location_name}
          </Link>
          {e.owner_employee_id && (
            <Link href={`/employees/${e.owner_employee_id}`} style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--fg-2)", textDecoration: "none" }}>
              <Av initials={e.owner_initials ?? "?"} size={20} /> {e.owner_name}
            </Link>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--fg)", color: "var(--bg)", display: "grid", placeContent: "center" }}>
            <I.spark size={13} />
          </span>
          <span className="eyebrow" style={{ fontSize: 9.5 }}>AI summary</span>
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--fg)" }}>{e.summary}</p>
      </div>

      <div className="card" style={{ padding: 18, background: "var(--surface-2)" }}>
        <div className="eyebrow" style={{ fontSize: 9.5, marginBottom: 8 }}>Recommended action</div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--fg-2)" }}>{e.action}</p>
      </div>

      <div className="ph" style={{ height: 120 }}><span>evidence · {e.evidence}</span></div>

      <EscalationActions escalationId={e.id} status={e.status} />
    </div>
  );
}
