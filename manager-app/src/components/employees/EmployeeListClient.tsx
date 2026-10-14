"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Av, I, ScorePill } from "@/components/ui";
import type { EmployeeWithLocation } from "@/lib/types";

const COLS = "2.2fr 1.4fr 1fr 1fr 1fr 0.9fr 32px";

export function EmployeeListClient({ employees }: { employees: EmployeeWithLocation[] }) {
  const [sort, setSort] = useState<"score" | "name">("score");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const needle = q.toLowerCase();
    return employees
      .filter(
        (e) =>
          e.name.toLowerCase().includes(needle) ||
          (e.location_name ?? "").toLowerCase().includes(needle),
      )
      .sort((a, b) => (sort === "score" ? b.score - a.score : a.name.localeCompare(b.name)));
  }, [employees, q, sort]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* controls */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 340 }}>
          <span style={{ position: "absolute", left: 11, top: 9, color: "var(--fg-3)" }}>
            <I.search size={15} />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search employees or locations…"
            className="input"
            style={{ paddingLeft: 34 }}
            aria-label="Search employees"
          />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)" }}>
          {([["score", "AI Score"], ["name", "Name"]] as const).map(([k, lbl]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className="btn btn-sm"
              style={{
                height: 26,
                border: "none",
                background: sort === k ? "var(--active)" : "transparent",
                color: sort === k ? "var(--fg)" : "var(--fg-3)",
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            gap: 12,
            padding: "11px 18px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface-2)",
          }}
        >
          {["Employee", "Location · Shift", "AI Score", "Quality", "SOP", "Status", ""].map((h, i) => (
            <div key={i} className="eyebrow" style={{ fontSize: 10 }}>
              {h}
            </div>
          ))}
        </div>

        {rows.map((e, i) => (
          <Link
            key={e.id}
            href={`/employees/${e.id}`}
            style={{
              display: "grid",
              gridTemplateColumns: COLS,
              gap: 12,
              alignItems: "center",
              width: "100%",
              padding: "12px 18px",
              borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
              textDecoration: "none",
              color: "var(--fg)",
            }}
            className="row-link"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
              <Av initials={e.initials} size={34} online={e.status === "on-shift"} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {e.name}
                </div>
                <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{e.role}</div>
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: "var(--fg-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {e.location_name}
              </div>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{e.shift}</div>
            </div>
            <ScorePill v={e.score} sm />
            <span className="mono tnum" style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{e.quality}%</span>
            <span className="mono tnum" style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{e.sop}%</span>
            <span>
              {e.status === "on-shift" ? (
                <span className="chip good" style={{ height: 20 }}><span className="dot" />On shift</span>
              ) : (
                <span className="chip" style={{ height: 20 }}>Off</span>
              )}
            </span>
            <span style={{ color: "var(--fg-3)" }}><I.arrow size={15} /></span>
          </Link>
        ))}

        {rows.length === 0 && (
          <div style={{ padding: "28px 18px", textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>
            No employees match “{q}”.
          </div>
        )}
      </div>

      <style>{`.row-link:hover { background: var(--hover); }`}</style>
    </div>
  );
}
