import Link from "next/link";
import { listTasks } from "@/lib/data";
import { PRIORITY, TASK_COLUMNS } from "@/lib/labels";
import type { TaskDetail } from "@/lib/types";

export default async function TasksPage() {
  const tasks = await listTasks();
  const byStatus = (s: string) => tasks.filter((t) => t.status === s);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Operate</div>
        <h1 style={{ fontSize: 22 }}>Tasks</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${TASK_COLUMNS.length}, minmax(190px, 1fr))`, gap: 12, overflowX: "auto" }}>
        {TASK_COLUMNS.map((col) => {
          const items = byStatus(col.key);
          return (
            <div key={col.key} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 2px" }}>
                <span className="eyebrow" style={{ fontSize: 9.5 }}>{col.label}</span>
                <span className="mono tnum" style={{ fontSize: 10.5, color: "var(--fg-4)" }}>{items.length}</span>
              </div>
              {items.map((t) => (
                <TaskCard key={t.id} t={t} />
              ))}
              {items.length === 0 && (
                <div style={{ border: "1px dashed var(--border)", borderRadius: "var(--r-md)", padding: "14px 0", textAlign: "center", color: "var(--fg-4)", fontSize: 11 }}>
                  —
                </div>
              )}
            </div>
          );
        })}
      </div>
      <style>{`.row-link:hover { background: var(--hover); border-color: var(--border-2); }`}</style>
    </div>
  );
}

function TaskCard({ t }: { t: TaskDetail }) {
  return (
    <Link
      href={`/tasks/${t.id}`}
      className="card row-link"
      style={{ padding: 13, display: "flex", flexDirection: "column", gap: 9, textDecoration: "none", color: "var(--fg)" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 7, height: 7, borderRadius: 99, background: PRIORITY[t.priority], flex: "none" }} />
        <span className="mono" style={{ fontSize: 9.5, color: "var(--fg-4)" }}>{t.id}</span>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: 9.5, color: "var(--fg-3)" }}>{t.due_label}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35 }}>{t.title}</div>
      <div className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>{t.location_name} · {t.assignee_name}</div>
      {t.source && <span className="tag" style={{ alignSelf: "flex-start" }}>{t.source}</span>}
    </Link>
  );
}
