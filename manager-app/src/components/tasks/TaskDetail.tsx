import Link from "next/link";
import { Av, I, scoreColor } from "@/components/ui";
import { PRIORITY } from "@/lib/labels";
import { TaskActions } from "@/components/tasks/TaskActions";
import { CallNowButton } from "@/components/calls/CallNowButton";
import { ScheduleReminderButton } from "@/components/calls/ScheduleReminderButton";
import type { TaskFull, EscalationLevel } from "@/lib/types";

const STATUS_LABEL: Record<string, { label: string; c: string }> = {
  todo: { label: "To do", c: "var(--fg-3)" },
  "in-progress": { label: "In progress", c: "var(--info)" },
  review: { label: "In review", c: "var(--warn)" },
  overdue: { label: "Overdue", c: "var(--crit)" },
  done: { label: "Done", c: "var(--good)" },
};
const ESC_LABEL: Record<EscalationLevel, { label: string; c: string } | null> = {
  none: null,
  low: { label: "Esc · low", c: "var(--info)" },
  med: { label: "Esc · medium", c: "var(--warn)" },
  high: { label: "Esc · high", c: "var(--crit)" },
};

function Section({ eyebrow, title, children, right }: { eyebrow: string; title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div className="eyebrow" style={{ fontSize: 9.5, marginBottom: 4 }}>{eyebrow}</div>
          <h2 style={{ fontSize: 15 }}>{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span className="eyebrow" style={{ fontSize: 8.5 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: "var(--fg)" }}>{children}</span>
    </div>
  );
}

export function TaskDetail({ t }: { t: TaskFull }) {
  const st = STATUS_LABEL[t.status] ?? STATUS_LABEL.todo;
  const esc = ESC_LABEL[t.escalation_level];
  const failed = t.inspection_checks.filter((c) => !c.pass).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      {/* ── Overview ─────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="chip" style={{ height: 22, color: st.c, borderColor: `color-mix(in oklab,${st.c} 35%,transparent)` }}>
            <span className="dot" />{st.label}
          </span>
          <span className="chip" style={{ height: 22 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: PRIORITY[t.priority] }} /> {t.priority} priority
          </span>
          {esc && (
            <span className="chip" style={{ height: 22, color: esc.c, borderColor: `color-mix(in oklab,${esc.c} 35%,transparent)` }}>{esc.label}</span>
          )}
          {t.origin === "ai" && (
            <span className="chip" style={{ height: 22 }}><I.spark size={11} /> AI-generated</span>
          )}
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-4)" }}>{t.id}</span>
        </div>

        <h1 style={{ fontSize: 21, lineHeight: 1.25 }}>{t.title}</h1>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14, padding: "14px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <MetaRow label="Assignee">
            {t.assignee_employee_id ? (
              <Link href={`/employees/${t.assignee_employee_id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--fg)", textDecoration: "none" }}>
                <Av initials={(t.assignee_name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("")} size={18} /> {t.assignee_name}
              </Link>
            ) : "Unassigned"}
          </MetaRow>
          <MetaRow label="Location">
            {t.location_id ? <Link href={`/locations/${t.location_id}`} style={{ color: "var(--fg)" }}>{t.location_name}</Link> : "—"}
          </MetaRow>
          <MetaRow label="Due">{t.due_label}</MetaRow>
          <MetaRow label="Deadline">{t.completion_deadline ?? "—"}</MetaRow>
          <MetaRow label="Created">{t.created_at_label}</MetaRow>
          <MetaRow label="Created by">{t.created_by}</MetaRow>
        </div>

        {t.reason && (
          <div className="card" style={{ padding: 14, background: "var(--surface-2)" }}>
            <span className="eyebrow" style={{ fontSize: 9 }}>Reason</span>
            <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.5, color: "var(--fg)" }}>{t.reason}</p>
          </div>
        )}
      </div>

      {/* ── Manager actions ──────────────────────────────────── */}
      <Section eyebrow="Manager" title="Actions">
        <TaskActions taskId={t.id} />
        {t.assignee_employee_id && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 2 }}>
            <CallNowButton
              employeeId={t.assignee_employee_id}
              employeeName={t.assignee_name ?? undefined}
              taskId={t.id}
              label="Call now"
            />
            <ScheduleReminderButton
              employeeId={t.assignee_employee_id}
              taskId={t.id}
              defaultNote={t.title}
            />
          </div>
        )}
      </Section>

      {/* ── AI reasoning ─────────────────────────────────────── */}
      {t.origin === "ai" && (t.ai_detected.length > 0 || t.ai_recommendation) && (
        <Section eyebrow="AI reasoning" title="Why this task exists">
          <div className="card" style={{ padding: 16, position: "relative", overflow: "hidden" }}>
            <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.5, maskImage: "radial-gradient(120% 100% at 100% 0%, black, transparent 70%)" }} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: "var(--fg)", color: "var(--bg)", display: "grid", placeContent: "center" }}><I.spark size={13} /></span>
                <span className="eyebrow" style={{ fontSize: 9 }}>AI detected</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {t.ai_detected.map((d, i) => (
                  <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, color: "var(--fg-2)" }}>
                    <span style={{ width: 16, height: 16, borderRadius: 5, flex: "none", marginTop: 1, background: "var(--crit-soft)", color: "var(--crit)", display: "grid", placeContent: "center", fontSize: 10 }}>!</span>
                    {d}
                  </div>
                ))}
              </div>
              {t.ai_recommendation && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                  <span className="eyebrow" style={{ fontSize: 9 }}>AI recommendation</span>
                  <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "var(--fg)" }}>{t.ai_recommendation}</p>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ── Task details ─────────────────────────────────────── */}
      <Section eyebrow="Details" title="Task brief">
        <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--fg-2)" }}>{t.description}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {t.sop_id && (
              <div>
                <span className="eyebrow" style={{ fontSize: 8.5 }}>Linked SOP</span>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 5, fontSize: 13 }}>
                  <I.book size={14} style={{ color: "var(--fg-3)" }} /> {t.sop_title} <span className="mono" style={{ fontSize: 10, color: "var(--fg-4)" }}>{t.sop_id}</span>
                </div>
              </div>
            )}
            {t.training_title && (
              <div>
                <span className="eyebrow" style={{ fontSize: 8.5 }}>Related training</span>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 5, fontSize: 13 }}>
                  <I.video size={14} style={{ color: "var(--fg-3)" }} /> {t.training_title}
                </div>
              </div>
            )}
          </div>

          {t.equipment.length > 0 && (
            <div>
              <span className="eyebrow" style={{ fontSize: 8.5 }}>Required equipment</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
                {t.equipment.map((e) => <span key={e} className="tag">{e}</span>)}
              </div>
            </div>
          )}

          {t.quality_standard && (
            <div>
              <span className="eyebrow" style={{ fontSize: 8.5 }}>Quality standard</span>
              <p style={{ margin: "5px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "var(--fg-2)" }}>{t.quality_standard}</p>
            </div>
          )}

          {t.checklist.length > 0 && (
            <div>
              <span className="eyebrow" style={{ fontSize: 8.5 }}>Checklist</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8 }}>
                {t.checklist.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: c.done ? "var(--fg-2)" : "var(--fg)" }}>
                    <span style={{ width: 16, height: 16, flex: "none", borderRadius: 5, display: "grid", placeContent: "center", background: c.done ? "var(--good-soft)" : "var(--surface-2)", border: c.done ? "none" : "1px solid var(--border-2)", color: "var(--good)" }}>
                      {c.done && <I.check size={11} sw={2.6} />}
                    </span>
                    <span style={{ textDecoration: c.done ? "line-through" : "none", textDecorationColor: "var(--fg-4)" }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {t.verification_required && (
            <span className="chip warn" style={{ height: 22, alignSelf: "flex-start" }}><I.scan size={11} /> Photo verification required</span>
          )}
        </div>
      </Section>

      {/* ── Media & verification ─────────────────────────────── */}
      {(t.media.length > 0 || t.inspection_checks.length > 0) && (
        <Section eyebrow="Quality inspection" title="Media & verification" right={failed > 0 ? <span className="chip crit" style={{ height: 22 }}>{failed} failed</span> : <span className="chip good" style={{ height: 22 }}>All pass</span>}>
          {t.media.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
              {t.media.map((m, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="ph" style={{ height: 96, position: "relative" }}>
                    <span>{m.kind} · {m.label}</span>
                    {m.result && (
                      <span className={"chip " + (m.result === "pass" ? "good" : "crit")} style={{ position: "absolute", top: 7, right: 7, height: 19, fontSize: 9.5 }}>
                        {m.result === "pass" ? "PASS" : "FAIL"}
                      </span>
                    )}
                  </div>
                  {m.note && <span className="mono" style={{ fontSize: 9.5, color: "var(--crit)", lineHeight: 1.4 }}>{m.note}</span>}
                </div>
              ))}
            </div>
          )}

          {t.inspection_checks.length > 0 && (
            <div className="card" style={{ padding: 14 }}>
              <span className="eyebrow" style={{ fontSize: 9 }}>AI analysis vs SOP standard</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 10 }}>
                {t.inspection_checks.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13 }}>
                    <span style={{ color: c.pass ? "var(--good)" : "var(--crit)" }}>{c.pass ? <I.check size={15} sw={2.4} /> : <I.close size={15} sw={2.4} />}</span>
                    <span style={{ color: c.pass ? "var(--fg-2)" : "var(--fg)" }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── Employee activity ────────────────────────────────── */}
      {(t.activity.length > 0 || t.time_spent || t.ai_confidence != null || t.sop_adherence != null) && (
        <Section eyebrow="Assignee" title="Employee activity">
          {(t.time_spent || t.ai_confidence != null || t.sop_adherence != null) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                ["Time spent", t.time_spent ?? "—", "var(--fg)"] as const,
                ["AI confidence", t.ai_confidence != null ? t.ai_confidence + "%" : "—", t.ai_confidence != null ? scoreColor(t.ai_confidence) : "var(--fg)"] as const,
                ["SOP adherence", t.sop_adherence != null ? t.sop_adherence + "%" : "—", t.sop_adherence != null ? scoreColor(t.sop_adherence) : "var(--fg)"] as const,
              ].map(([l, v, c]) => (
                <div key={l} className="card" style={{ padding: 12, textAlign: "center" }}>
                  <div className="mono tnum" style={{ fontSize: 18, fontWeight: 600, color: c }}>{v}</div>
                  <div className="eyebrow" style={{ fontSize: 8, marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          )}
          {t.activity.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              {t.activity.map((m, i) =>
                m.who === "ai" ? (
                  <div key={i} style={{ maxWidth: "88%" }}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.45, padding: "9px 12px", borderRadius: "4px 12px 12px 12px", background: "var(--surface-2)", border: "1px solid var(--border)" }}>{m.body}</div>
                    {m.at && <span className="mono" style={{ fontSize: 8.5, color: "var(--fg-4)", marginLeft: 4 }}>AI · {m.at}</span>}
                  </div>
                ) : (
                  <div key={i} style={{ alignSelf: "flex-end", maxWidth: "84%", textAlign: "right" }}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.4, color: "var(--bg)", background: "var(--fg)", padding: "9px 12px", borderRadius: "12px 4px 12px 12px", textAlign: "left" }}>{m.body}</div>
                    {m.at && <span className="mono" style={{ fontSize: 8.5, color: "var(--fg-4)", marginRight: 4 }}>{m.at}</span>}
                  </div>
                ),
              )}
            </div>
          )}
        </Section>
      )}

      {/* ── Timeline (audit trail) ───────────────────────────── */}
      <Section eyebrow="Audit trail" title="Timeline">
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 5, top: 6, bottom: 6, width: 1.5, background: "var(--border)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {t.timeline.map((e, i) => {
              const c = e.actor === "AI" ? "var(--fg)" : e.actor === "Manager" ? "var(--info)" : "var(--good)";
              return (
                <div key={i} style={{ display: "flex", gap: 14, position: "relative" }}>
                  <span style={{ width: 11, height: 11, borderRadius: 99, marginTop: 2, flex: "none", background: c, boxShadow: "0 0 0 3px var(--bg)", zIndex: 1 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                      <span className="mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>{e.at}</span>
                      <span className="tag">{e.actor}</span>
                    </div>
                    <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.45 }}>{e.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── AI insights ──────────────────────────────────────── */}
      {t.ai_insights.length > 0 && (
        <Section eyebrow="AI insights" title="Operational context">
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {t.ai_insights.map((ins, i) => (
              <div key={i} className="card" style={{ padding: 13, display: "flex", gap: 11, alignItems: "flex-start", background: "var(--surface-2)" }}>
                <span style={{ width: 24, height: 24, flex: "none", borderRadius: 7, background: "var(--accent-soft)", color: "var(--fg)", display: "grid", placeContent: "center" }}><I.spark size={13} /></span>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: "var(--fg-2)" }}>{ins}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
