/* AI MIDDLE MANAGER — Employees list + profile */

function ScorePill({ v, sm }) {
  const c = scoreColor(v);
  return (
    <span className="mono tnum" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: sm ? 12 : 13, fontWeight: 600, color: c }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: c }} /> {v}
    </span>
  );
}

function EmployeeList({ onOpen }) {
  const { employees } = window.AMM;
  const [sort, setSort] = useState('score');
  const [q, setQ] = useState('');
  const rows = employees
    .filter((e) => e.name.toLowerCase().includes(q.toLowerCase()) || e.loc.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === 'score' ? b.score - a.score : a.name.localeCompare(b.name));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 340 }}>
          <I.search size={15} style={{ position: 'absolute', left: 11, top: 9, color: 'var(--fg-3)' }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search employees or locations…"
            style={{ width: '100%', height: 34, padding: '0 12px 0 34px', borderRadius: 8, border: '1px solid var(--border-2)', background: 'var(--surface)', color: 'var(--fg)', font: 'inherit', fontSize: 13 }} />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          {[['score', 'AI Score'], ['name', 'Name']].map(([k, lbl]) => (
            <button key={k} onClick={() => setSort(k)} className="btn btn-sm" style={{ height: 26, border: 'none', background: sort === k ? 'var(--active)' : 'transparent', color: sort === k ? 'var(--fg)' : 'var(--fg-3)' }}>{lbl}</button>
          ))}
        </div>
        <button className="btn btn-sm"><I.filter size={14} /> Filter</button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.4fr 1fr 1fr 1fr 0.8fr 32px', gap: 12, padding: '11px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          {['Employee', 'Location · Shift', 'AI Score', 'Quality', 'SOP', 'Status', ''].map((h, i) => (
            <div key={i} className="eyebrow" style={{ fontSize: 10 }}>{h}</div>
          ))}
        </div>
        {rows.map((e, i) => (
          <button key={e.id} onClick={() => onOpen(e.id)}
            style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.4fr 1fr 1fr 1fr 0.8fr 32px', gap: 12, alignItems: 'center', width: '100%', padding: '12px 18px', border: 'none', borderBottom: i < rows.length-1 ? '1px solid var(--border)' : 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
            onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--hover)'}
            onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
              <Av initials={e.initials} size={34} online={e.status === 'on-shift'} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{e.role}</div>
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: 'var(--fg-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.loc}</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{e.shift}</div>
            </div>
            <ScorePill v={e.score} sm />
            <span className="mono tnum" style={{ fontSize: 12.5, color: 'var(--fg-2)' }}>{e.quality}%</span>
            <span className="mono tnum" style={{ fontSize: 12.5, color: 'var(--fg-2)' }}>{e.sop}%</span>
            <span>{e.status === 'on-shift'
              ? <span className="chip good" style={{ height: 20 }}><span className="dot" />On shift</span>
              : <span className="chip" style={{ height: 20 }}>Off</span>}</span>
            <I.arrow size={15} style={{ color: 'var(--fg-3)' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function MetricBar({ label, v }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--fg-2)' }}>{label}</span>
        <span className="mono tnum" style={{ color: scoreColor(v), fontWeight: 600 }}>{v}</span>
      </div>
      <div className="meter"><i style={{ width: `${v}%`, background: scoreColor(v) }} /></div>
    </div>
  );
}

function EmployeeProfile({ id, onBack, setView }) {
  const e = window.AMM.employees.find((x) => x.id === id);
  const coaching = [
    { when:'Today 08:42', ch:'Voice', text:'Coached on red-wine carpet stain SOP. Resolved in one call.', good:true },
    { when:'2d ago', ch:'Telegram', text:'Completed updated bathroom cleaning module — quiz 9/10.', good:true },
    { when:'1w ago', ch:'WhatsApp', text:'Reminder sent: pool chemical log overdue. Acknowledged.', good:false },
    { when:'2w ago', ch:'Voice', text:'Recognised for 40% above-average task completion.', good:true },
  ];
  const metrics = [
    ['Task completion', e.tasks > 100 ? 96 : 78], ['Quality of work', e.quality],
    ['SOP adherence', e.sop], ['Reliability', e.reliability], ['Training', e.training],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <button onClick={onBack} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', color: 'var(--fg-2)' }}>
        <I.arrow size={14} style={{ transform: 'rotate(180deg)' }} /> All employees
      </button>

      {/* header */}
      <div className="card" style={{ padding: 24, display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
        <Av initials={e.initials} size={66} online={e.status === 'on-shift'} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 22 }}>{e.name}</h2>
            {e.status === 'on-shift'
              ? <span className="chip good"><span className="dot" />On shift · {e.shift}</span>
              : <span className="chip">Off shift</span>}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12.5, color: 'var(--fg-2)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}><I.users size={14} style={{ color: 'var(--fg-3)' }} />{e.role}</span>
            <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}><I.pin size={14} style={{ color: 'var(--fg-3)' }} />{e.loc}</span>
            <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}><I.clock size={14} style={{ color: 'var(--fg-3)' }} />{e.tenure} tenure</span>
            <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}><I.chat size={14} style={{ color: 'var(--fg-3)' }} />Primary: {e.channel}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" onClick={() => setView('conversations')}><I.chat size={14} /> Conversations</button>
          <button className="btn btn-primary btn-sm"><I.send size={13} /> Message via AI</button>
        </div>
      </div>

      {/* score + metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: 22, alignItems: 'stretch' }}>
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: .5, maskImage: 'radial-gradient(80% 70% at 50% 0%, black, transparent)' }} />
          <span className="eyebrow" style={{ position: 'relative' }}>AI Performance Score</span>
          <div style={{ position: 'relative' }}><Ring value={e.score} size={150} /></div>
          <div style={{ position: 'relative' }}>
            <Delta value={Math.abs(e.delta) + ' pts'} dir={e.delta >= 0 ? 'up' : 'down'} /> <span style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>vs last month</span>
          </div>
          <p className="mono" style={{ position: 'relative', fontSize: 10.5, color: 'var(--fg-3)', lineHeight: 1.5, margin: 0 }}>
            Composite of completion, quality,<br />SOP adherence & reliability
          </p>
        </div>

        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <SectionTitle eyebrow="Breakdown" title="Performance signals" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {metrics.map(([l, v]) => <MetricBar key={l} label={l} v={v} />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 4, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            {[['Tasks total', e.tasks], ['This week', e.tasksWk], ['Escalations', e.escalations], ['Training', e.training + '%']].map(([l, v]) => (
              <div key={l}>
                <div className="mono tnum" style={{ fontSize: 20, fontWeight: 600 }}>{v}</div>
                <div className="eyebrow" style={{ fontSize: 9.5, marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SOP knowledge & retention */}
      <KnowledgeRetention id={id} />

      {/* coaching history */}
      <div className="card" style={{ padding: 24 }}>
        <SectionTitle eyebrow="AI coaching history" title="Recent interactions">
          <button className="btn btn-sm btn-ghost" style={{ color: 'var(--fg-2)' }} onClick={() => setView('conversations')}>View all <I.arrow size={13} /></button>
        </SectionTitle>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 1.5, background: 'var(--border)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {coaching.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                <span style={{ width: 11, height: 11, borderRadius: 99, marginTop: 3, flex: 'none', background: c.good ? 'var(--good)' : 'var(--warn)', boxShadow: '0 0 0 3px var(--surface)', zIndex: 1 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 3 }}>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{c.when}</span>
                    <span className="tag">{c.ch}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5 }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KnowledgeRetention({ id }) {
  const rec = window.AMM.quizRecords.find((r) => r.id === id);
  if (!rec) return null;
  const passed = rec.status === 'pass';
  const acc = scoreColor(rec.knowledge);
  return (
    <div className="card" style={{ padding: 24 }}>
      <SectionTitle eyebrow="AI Training Quiz" title="SOP knowledge & retention">
        <span className="chip" style={{ height: 24 }}><I.brain size={12} /> {rec.attempts} attempt{rec.attempts > 1 ? 's' : ''}</span>
      </SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)', gap: 22, alignItems: 'stretch' }}>
        {/* left: latest quiz */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div style={{ width: 36, height: 36, flex: 'none', borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeContent: 'center' }}><I.video size={17} style={{ color: 'var(--fg-3)' }} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 540 }}>{rec.sop}</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{rec.sopId} · completed {rec.when}</div>
            </div>
            {passed
              ? <span className="chip good" style={{ height: 22 }}><span className="dot" />Passed</span>
              : <span className="chip warn" style={{ height: 22 }}><span className="dot" />Needs review</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[['Quiz score', `${rec.score}/${rec.total}`, passed ? 'var(--good)' : 'var(--warn)'],
              ['SOP knowledge', `${rec.knowledge}%`, acc],
              ['Missed', rec.missed.length, rec.missed.length ? 'var(--crit)' : 'var(--good)']].map(([l, v, c]) => (
              <div key={l} className="card" style={{ padding: 13, background: 'var(--surface)' }}>
                <div className="mono tnum" style={{ fontSize: 20, fontWeight: 600, color: c }}>{v}</div>
                <div className="eyebrow" style={{ fontSize: 9, marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>

          {rec.missed.length > 0 && (
            <div>
              <div className="eyebrow" style={{ fontSize: 9.5, marginBottom: 8 }}>Questions missed</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {rec.missed.map((m, i) => <span key={i} className="chip crit" style={{ height: 24 }}><I.close size={11} sw={2.4} /> {m}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* right: retention history + recommendation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 16, background: 'var(--surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="eyebrow" style={{ fontSize: 9.5 }}>Retention history</span>
              <Delta value={Math.abs(rec.trend[rec.trend.length - 1] - rec.trend[0]) + ' pts'} dir={rec.trend[rec.trend.length - 1] >= rec.trend[0] ? 'up' : 'down'} />
            </div>
            <VBars data={rec.trend} labels={['4w', '3w', '2w', 'now']} h={84} color={acc} />
          </div>

          <div className="card" style={{ padding: 16, background: passed ? 'var(--surface)' : 'var(--warn-soft)', border: passed ? '1px solid var(--border)' : '1px solid color-mix(in oklab, var(--warn) 30%, transparent)', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
              <I.spark size={14} style={{ color: passed ? 'var(--fg-2)' : 'var(--warn)' }} />
              <span className="eyebrow" style={{ fontSize: 9.5 }}>AI recommendation</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--fg)', textWrap: 'pretty' }}>{rec.rec}.</p>
            {!passed && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-primary btn-sm"><I.send size={13} /> Send refresher</button>
                <button className="btn btn-sm"><I.replay size={13} /> Schedule re-quiz</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Employees({ setView }) {
  const [open, setOpen] = useState(null);
  return open
    ? <EmployeeProfile id={open} onBack={() => setOpen(null)} setView={setView} />
    : <EmployeeList onOpen={setOpen} />;
}

Object.assign(window, { Employees, KnowledgeRetention });
