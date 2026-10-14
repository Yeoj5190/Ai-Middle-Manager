/* AI MIDDLE MANAGER — Task Management */

const TASK_STATUS = {
  todo:          { label: 'To do',       c: 'var(--fg-3)',  soft: 'var(--active)' },
  'in-progress': { label: 'In progress', c: 'var(--info)',  soft: 'color-mix(in oklab, var(--info) 14%, transparent)' },
  review:        { label: 'Review',      c: 'var(--warn)',  soft: 'var(--warn-soft)' },
  overdue:       { label: 'Overdue',     c: 'var(--crit)',  soft: 'var(--crit-soft)' },
  done:          { label: 'Done',        c: 'var(--good)',  soft: 'var(--good-soft)' },
};
const PRIO = { high: 'var(--crit)', med: 'var(--warn)', low: 'var(--fg-3)' };
const SOURCE_ICON = { 'AI generated': 'spark', 'Escalation': 'alert', 'Compliance': 'shield', 'Recurring SOP': 'book' };
const COLS = ['todo', 'in-progress', 'review', 'done'];

function TaskCard({ t }) {
  const initials = t.assignee.split(' ').map(w=>w[0]).join('');
  const Src = I[SOURCE_ICON[t.source]] || I.dot;
  return (
    <div className="card" style={{ padding: 13, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'grab', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: PRIO[t.priority] }} />
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{t.id}</span>
        <span style={{ flex: 1 }} />
        <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Src size={11} /> {t.source}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4, textWrap: 'pretty' }}>{t.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--fg-3)' }}>
        <I.pin size={12} /> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.loc}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <Av initials={initials} size={22} />
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.assignee.split(' ')[0]}</span>
        </span>
        <span className="mono" style={{ fontSize: 10.5, color: t.status === 'overdue' ? 'var(--crit)' : 'var(--fg-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <I.clock size={11} /> {t.due.replace('Today ', '')}
        </span>
      </div>
    </div>
  );
}

function Tasks() {
  const { tasks } = window.AMM;
  const cols = COLS.map((c) => ({ id: c, ...TASK_STATUS[c], items: tasks.filter((t) => t.status === c) }));
  // overdue folds into todo column visually-top
  const todoCol = cols.find(c=>c.id==='todo');
  const overdue = tasks.filter(t=>t.status==='overdue');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 7 }}>
          {Object.entries(PRIO).map(([k, c]) => (
            <span key={k} className="chip" style={{ height: 28 }}><span className="dot" style={{ background: c }} />{k}</span>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm"><I.filter size={14} /> Filter</button>
        <button className="btn btn-primary btn-sm"><I.plus size={14} /> New task</button>
      </div>

      {/* AI banner */}
      <div className="card" style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-2)' }}>
        <div style={{ width: 28, height: 28, flex: 'none', borderRadius: 8, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.spark size={15} /></div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-2)', flex: 1 }}>
          <span style={{ color: 'var(--fg)', fontWeight: 500 }}>AI generated 6 tasks</span> overnight from recurring SOPs and 2 escalations. 1 task is overdue and needs reassignment.
        </p>
        <button className="btn btn-sm">Review</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignItems: 'start' }}>
        {cols.map((col) => {
          const items = col.id === 'todo' ? [...overdue, ...col.items] : col.items;
          return (
            <div key={col.id} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 2px' }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: col.c }} />
                <span style={{ fontSize: 12.5, fontWeight: 540 }}>{col.label}</span>
                <span className="mono tnum" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{items.length}</span>
                <span style={{ flex: 1 }} />
                <I.plus size={14} style={{ color: 'var(--fg-3)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 120, padding: 8, borderRadius: 'var(--r-md)', background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                {items.length ? items.map((t) => <TaskCard key={t.id} t={t} />)
                  : <div className="mono" style={{ fontSize: 11, color: 'var(--fg-4)', textAlign: 'center', padding: '24px 0' }}>—</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { Tasks });
