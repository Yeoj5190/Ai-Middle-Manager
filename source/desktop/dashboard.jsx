/* AI MIDDLE MANAGER — Dashboard view */

function StatCard({ s }) {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="eyebrow" style={{ fontSize: 10.5 }}>{s.label}</span>
        <Delta value={s.delta} dir={s.dir} invert={s.invert} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div className="mono tnum" style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1 }}>{s.value}</div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 5 }}>{s.sub}</div>
        </div>
        <Sparkline data={s.spark} invert={s.invert} />
      </div>
    </div>
  );
}

function Briefing({ b, setView }) {
  return (
    <div className="card fade-up" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: .6, maskImage: 'radial-gradient(120% 100% at 100% 0%, black, transparent 70%)' }} />
      <div style={{ position: 'relative', padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}>
            <I.spark size={15} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 540 }}>AI Operations Briefing</span>
          <span className="chip good" style={{ height: 20 }}><span className="dot" />Live</span>
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{b.stamp}</span>
        </div>

        <p style={{ margin: 0, fontSize: 23, lineHeight: 1.45, letterSpacing: '-.015em', fontWeight: 400, maxWidth: 760, textWrap: 'pretty' }}>
          <span style={{ fontWeight: 560 }}>{b.greeting}</span>{' '}
          <span style={{ color: 'var(--fg-2)' }}>{b.body}</span>
        </p>

        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setView('escalations')}><I.alert size={14} /> Review escalation</button>
          <button className="btn btn-sm" onClick={() => setView('tasks')}>5 tasks to review</button>
          <button className="btn btn-sm" onClick={() => setView('employees')}>2 follow-ups</button>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--fg-3)' }}><I.send size={13} /> Send team update</button>
        </div>
      </div>
    </div>
  );
}

function LocationCard({ l, setView }) {
  const health = Math.round((l.quality + l.compliance) / 2);
  const hc = scoreColor(health);
  return (
    <button onClick={() => setView('analytics')} className="card" style={{ padding: 15, textAlign: 'left', cursor: 'pointer', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 13, transition: 'border-color .15s, transform .08s' }}
      onMouseEnter={(e)=>{e.currentTarget.style.borderColor='var(--border-strong)';e.currentTarget.style.transform='translateY(-1px)';}}
      onMouseLeave={(e)=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none';}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 540, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 2 }}>{l.area}</div>
        </div>
        {l.issues > 0
          ? <span className="chip crit" style={{ height: 20 }}>{l.issues} issue{l.issues>1?'s':''}</span>
          : <span className="chip good" style={{ height: 20 }}><I.check size={11} sw={2.4}/></span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 7, height: 7, borderRadius: 99, background: hc }} />
        <span className="mono tnum" style={{ fontSize: 12, color: 'var(--fg-2)' }}>{health}% health</span>
        <span style={{ flex: 1 }} />
        <Delta value={Math.abs(l.trend)+'%'} dir={l.trend >= 0 ? 'up' : 'down'} />
      </div>

      <div className="meter"><i style={{ width: `${health}%`, background: hc }} /></div>

      <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--fg-3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><I.users size={13} /><b className="mono tnum" style={{ color: 'var(--fg-2)', fontWeight: 500 }}>{l.staff}</b> on shift</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><I.checklist size={13} /><b className="mono tnum" style={{ color: 'var(--fg-2)', fontWeight: 500 }}>{l.open}</b> open</span>
      </div>
    </button>
  );
}

function InsightRow({ ins, setView }) {
  const map = { crit: { c: 'var(--crit)', ic: 'alert' }, warn: { c: 'var(--warn)', ic: 'trend' }, good: { c: 'var(--good)', ic: 'check' } };
  const m = map[ins.sev]; const Ico = I[m.ic];
  return (
    <div style={{ display: 'flex', gap: 12, padding: '13px 4px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 28, height: 28, flex: 'none', borderRadius: 8, display: 'grid', placeContent: 'center', background: `color-mix(in oklab, ${m.c} 14%, transparent)`, color: m.c }}>
        <Ico size={15} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--fg)', textWrap: 'pretty' }}>{ins.text}</p>
      </div>
      <button className="btn btn-ghost btn-sm" style={{ flex: 'none', color: 'var(--fg-2)' }} onClick={() => setView(ins.action.includes('Bianca') ? 'employees' : ins.action.includes('escalation') ? 'escalations' : ins.action.includes('analytics') ? 'analytics' : 'dashboard')}>
        {ins.action} <I.arrow size={13} />
      </button>
    </div>
  );
}

function RetentionCard({ setView }) {
  const { retention, quizRecords } = window.AMM;
  const needs = quizRecords.filter((r) => r.status === 'needs-review');
  const feat = quizRecords.find((r) => r.id === 'bianca');
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.brain size={15} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 560 }}>SOP Knowledge Retention</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>AI quiz results · last 7 days</div>
        </div>
        <span className="chip" style={{ height: 22 }}><I.spark size={11} /> AI</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid var(--border)' }}>
        {[['Avg knowledge', retention.avgKnowledge + '%', scoreColor(retention.avgKnowledge)], ['Pass rate', retention.passRate + '%', scoreColor(retention.passRate)], ['Need retraining', retention.needRetraining, 'var(--crit)']].map(([l, v, c], i) => (
          <div key={l} style={{ padding: '13px 14px', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <div className="mono tnum" style={{ fontSize: 21, fontWeight: 600, color: c }}>{v}</div>
            <div className="eyebrow" style={{ fontSize: 9, marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* featured AI recommendation (Bianca) */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
          <Av initials={feat.initials} size={26} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5 }}><b style={{ fontWeight: 560 }}>{feat.emp}</b> completed “{feat.sop}”</div>
          </div>
          <span className="mono tnum" style={{ fontSize: 13, fontWeight: 600, color: scoreColor(feat.knowledge) }}>{feat.score}/{feat.total}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', paddingLeft: 35 }}>
          <span className="chip crit" style={{ height: 20, flex: 'none' }}>Missed: {feat.missed[0]}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 9, paddingLeft: 35 }}>
          <I.spark size={13} style={{ color: 'var(--fg-3)', flex: 'none', marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: 'var(--fg-2)' }}>{feat.rec}.</p>
        </div>
      </div>

      {/* needs-retraining list */}
      <div style={{ padding: '12px 16px 14px' }}>
        <div className="eyebrow" style={{ fontSize: 9.5, marginBottom: 9 }}>Flagged for retraining</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {needs.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Av initials={r.initials} size={24} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.emp}</div>
                <div className="mono" style={{ fontSize: 9.5, color: 'var(--fg-3)' }}>{r.sop}</div>
              </div>
              <span className="mono tnum" style={{ fontSize: 12, fontWeight: 600, color: 'var(--crit)' }}>{r.score}/{r.total}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 12, color: 'var(--fg-3)' }} onClick={() => setView('analytics')}>
          <I.chart size={13} /> View knowledge analytics
        </button>
      </div>
    </div>
  );
}

function Dashboard({ setView }) {
  const { briefing, stats, locations, insights } = window.AMM;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      <Briefing b={briefing} setView={setView} />

      {/* live ops */}
      <div>
        <SectionTitle eyebrow="Live operations" title="Right now across all locations">
          <span className="chip" style={{ height: 26 }}><span className="dot" style={{ background: 'var(--good)' }} /> Updated 12s ago</span>
        </SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {stats.map((s) => <StatCard key={s.id} s={s} />)}
        </div>
      </div>

      {/* two col: locations + recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(300px, 1fr)', gap: 22, alignItems: 'start' }}>
        <div>
          <SectionTitle eyebrow="Location health" title="Properties">
            <button className="btn btn-sm btn-ghost" style={{ color: 'var(--fg-2)' }}>Map view <I.pin size={13} /></button>
          </SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
            {locations.map((l) => <LocationCard key={l.id} l={l} setView={setView} />)}
          </div>
        </div>

        <div>
          <SectionTitle eyebrow="AI recommendations" title="What needs you" />
          <div className="card" style={{ padding: '4px 16px 12px' }}>
            {insights.map((ins, i) => <InsightRow key={i} ins={ins} setView={setView} />)}
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 10, color: 'var(--fg-3)' }}>
              <I.spark size={13} /> Ask the AI Manager a question
            </button>
          </div>

          <div style={{ marginTop: 22 }}>
            <SectionTitle eyebrow="Training" title="Knowledge retention" />
            <RetentionCard setView={setView} />
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, RetentionCard });
