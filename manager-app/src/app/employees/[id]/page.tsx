import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployee, getQuizRecord, listEvents } from "@/lib/data";
import { Av, Delta, I, MetricBar, Ring } from "@/components/ui";
import { EmployeeActions } from "@/components/employees/EmployeeActions";
import { KnowledgeRetention } from "@/components/employees/KnowledgeRetention";
import { CoachingTimeline } from "@/components/employees/CoachingTimeline";
import { CallNowButton } from "@/components/calls/CallNowButton";

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [e, rec, events] = await Promise.all([
    getEmployee(id),
    getQuizRecord(id),
    listEvents(id),
  ]);
  if (!e) notFound();

  // Performance signals (README §7: composite of completion, quality, SOP,
  // reliability, training).
  const metrics: [string, number][] = [
    ["Task completion", e.tasks > 100 ? 96 : 78],
    ["Quality of work", e.quality],
    ["SOP adherence", e.sop],
    ["Reliability", e.reliability],
    ["Training", e.training],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <Link href="/employees" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", color: "var(--fg-2)" }}>
        <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><I.arrow size={14} /></span> All employees
      </Link>

      {/* header */}
      <div className="card" style={{ padding: 24, display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
        <Av initials={e.initials} size={66} online={e.status === "on-shift"} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 22 }}>{e.name}</h1>
            {e.status === "on-shift" ? (
              <span className="chip good"><span className="dot" />On shift · {e.shift}</span>
            ) : (
              <span className="chip">Off shift</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12.5, color: "var(--fg-2)", flexWrap: "wrap" }}>
            <span style={{ display: "flex", gap: 5, alignItems: "center" }}><span style={{ color: "var(--fg-3)" }}><I.users size={14} /></span>{e.role}</span>
            <span style={{ display: "flex", gap: 5, alignItems: "center" }}><span style={{ color: "var(--fg-3)" }}><I.pin size={14} /></span>{e.location_name}</span>
            <span style={{ display: "flex", gap: 5, alignItems: "center" }}><span style={{ color: "var(--fg-3)" }}><I.clock size={14} /></span>{e.tenure} tenure</span>
            <span style={{ display: "flex", gap: 5, alignItems: "center" }}><span style={{ color: "var(--fg-3)" }}><I.chat size={14} /></span>Primary: {e.channel}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
          <EmployeeActions
            employeeId={e.id}
            employeeName={e.name}
            actions={[{ type: "message", label: "Message via AI", icon: "send", primary: true }]}
          />
          <CallNowButton employeeId={e.id} employeeName={e.name} />
        </div>
      </div>

      {/* score + metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)", gap: 22, alignItems: "stretch" }}>
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.5, maskImage: "radial-gradient(80% 70% at 50% 0%, black, transparent)" }} />
          <span className="eyebrow" style={{ position: "relative" }}>AI Performance Score</span>
          <div style={{ position: "relative" }}><Ring value={e.score} size={150} /></div>
          <div style={{ position: "relative" }}>
            <Delta value={Math.abs(e.delta) + " pts"} dir={e.delta >= 0 ? "up" : "down"} />{" "}
            <span style={{ fontSize: 11.5, color: "var(--fg-3)" }}>vs last month</span>
          </div>
          <p className="mono" style={{ position: "relative", fontSize: 10.5, color: "var(--fg-3)", lineHeight: 1.5, margin: 0 }}>
            Composite of completion, quality,
            <br />
            SOP adherence &amp; reliability
          </p>
        </div>

        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Breakdown</div>
            <h2 style={{ fontSize: 19 }}>Performance signals</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            {metrics.map(([l, v]) => (
              <MetricBar key={l} label={l} v={v} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 4, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            {([
              ["Tasks total", e.tasks],
              ["This week", e.tasks_wk],
              ["Escalations", e.escalations],
              ["Training", e.training + "%"],
            ] as const).map(([l, v]) => (
              <div key={l}>
                <div className="mono tnum" style={{ fontSize: 20, fontWeight: 600 }}>{v}</div>
                <div className="eyebrow" style={{ fontSize: 9.5, marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <KnowledgeRetention rec={rec} employeeId={e.id} employeeName={e.name} />
      <CoachingTimeline events={events} />
    </div>
  );
}
