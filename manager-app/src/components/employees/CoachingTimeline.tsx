import { relativeTime } from "@/components/ui";
import type { EmployeeEvent } from "@/lib/types";

// AI coaching history — ported from desktop employees.jsx, now fed by real
// employee_events rows (seeded coaching + persisted manager actions).
export function CoachingTimeline({ events }: { events: EmployeeEvent[] }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>AI coaching history</div>
          <h2 style={{ fontSize: 19 }}>Recent interactions</h2>
        </div>
      </div>

      {events.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--fg-3)", margin: 0 }}>No interactions yet.</p>
      ) : (
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 5, top: 6, bottom: 6, width: 1.5, background: "var(--border)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {events.map((c) => (
              <div key={c.id} style={{ display: "flex", gap: 16, position: "relative" }}>
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 99,
                    marginTop: 3,
                    flex: "none",
                    background: c.good ? "var(--good)" : "var(--warn)",
                    boxShadow: "0 0 0 3px var(--surface)",
                    zIndex: 1,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 3 }}>
                    <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{relativeTime(c.created_at)}</span>
                    {c.channel && <span className="tag">{c.channel}</span>}
                    {c.kind === "action" && (
                      <span className="tag" style={{ color: "var(--fg-2)", borderColor: "var(--border-2)" }}>You</span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5 }}>{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
