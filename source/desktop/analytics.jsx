/* AI MIDDLE MANAGER — Analytics & Insights (hero) */

function KpiHead({ label, value, delta, dir, invert, data }) {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="eyebrow" style={{ fontSize: 10 }}>{label}</span>
        <Delta value={delta} dir={dir} invert={invert} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
        <span className="mono tnum" style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1 }}>{value}</span>
        <Sparkline data={data} w={84} h={28} invert={invert} />
      </div>
    </div>
  );
}

function Analytics({ setView }) {
  const a = window.AMM.analytics;
  const ret = window.AMM.retention;
  const retrain = window.AMM.quizRecords.filter((r) => r.status === 'needs-review');
  const ranges = ['7d', '4w', '12w', 'YTD'];
  const [range, setRange] = useState('12w');
  const locRows = [...a.byLocation].sort((x,y)=> (y.quality+y.compliance) - (x.quality+x.compliance))
    .map((l) => ({ label: l.name, value: Math.round((l.quality + l.compliance) / 2), color: (l.quality+l.compliance)/2 >= 90 ? 'var(--good)' : (l.quality+l.compliance)/2 >= 80 ? 'var(--warn)' : 'var(--crit)' }));

  const empRows = [...window.AMM.employees].sort((x,y)=>y.score-x.score).slice(0,6)
    .map((e) => ({ label: e.name, value: e.score, color: e.score >= 90 ? 'var(--good)' : e.score >= 75 ? 'var(--warn)' : 'var(--crit)' }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* AI insight banner */}
      <div className="card fade-up" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: .5, maskImage: 'radial-gradient(120% 120% at 100% 0%, black, transparent 70%)' }} />
        <div style={{ position: 'relative', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 28, height: 28, flex: 'none', borderRadius: 8, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.spark size={16} /></div>
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>AI generated insight</div>
            <p style={{ margin: 0, fontSize: 19, lineHeight: 1.5, letterSpacing: '-.01em', maxWidth: 720, textWrap: 'pretty' }}>
              Employees who watched the updated cleaning SOP <span style={{ color: 'var(--good)', fontWeight: 560 }}>reduced inspection failures by 37%</span>. Rolling it out to Granville could recover an estimated 9 hours of rework per week.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setView('sops')}>Push SOP to Granville</button>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--fg-3)' }}>Dismiss</button>
            </div>
          </div>
        </div>
      </div>

      {/* range toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <SectionTitle eyebrow="Operations analytics" title="Performance over time" />
        <span style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--surface-2)', borderRadius: 9, border: '1px solid var(--border)' }}>
          {ranges.map((r) => (
            <button key={r} onClick={() => setRange(r)} className="btn btn-sm mono" style={{ height: 28, border: 'none', background: range === r ? 'var(--active)' : 'transparent', color: range === r ? 'var(--fg)' : 'var(--fg-3)' }}>{r}</button>
          ))}
        </div>
      </div>

      {/* KPI heads */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <KpiHead label="Compliance" value="92%" delta="+11" dir="up" data={a.compliance} />
        <KpiHead label="Task completion" value="91%" delta="+19" dir="up" data={a.completion} />
        <KpiHead label="Inspection failures" value="5%" delta="-9" dir="down" invert data={a.failures} />
        <KpiHead label="Training completion" value="88%" delta="+12" dir="up" data={[60,64,68,70,74,78,80,82,84,86,87,88]} />
      </div>

      {/* main charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 20, alignItems: 'stretch' }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Trend · 12 weeks</div>
              <div style={{ fontSize: 15, fontWeight: 540 }}>Compliance & completion</div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[['Compliance', 'var(--fg)'], ['Completion', 'var(--info)']].map(([l, c]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--fg-2)' }}>
                  <span style={{ width: 16, height: 2.5, borderRadius: 2, background: c }} /> {l}
                </span>
              ))}
            </div>
          </div>
          <LineChart labels={a.weeks} yMin={60} yMax={100} fmt={(v)=>v+'%'} h={220}
            series={[
              { data: a.compliance, color: 'var(--fg)', fill: true },
              { data: a.completion, color: 'var(--info)' },
            ]} />
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Quality control</div>
          <div style={{ fontSize: 15, fontWeight: 540, marginBottom: 18 }}>Inspection failures / week</div>
          <VBars data={a.failures} labels={a.weeks} h={180} color="var(--crit)" />
          <p style={{ margin: '18px 0 0', fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.5 }}>
            Failures down <span className="mono" style={{ color: 'var(--good)' }}>64%</span> over the quarter, tracking the SOP video rollout.
          </p>
        </div>
      </div>

      {/* location + employee leaderboards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <SectionTitle eyebrow="Location health" title="Properties ranked" />
          <HBars rows={locRows} />
        </div>
        <div className="card" style={{ padding: 20 }}>
          <SectionTitle eyebrow="Workforce" title="Top performers">
            <button className="btn btn-sm btn-ghost" style={{ color: 'var(--fg-2)' }} onClick={() => setView('employees')}>All <I.arrow size={13} /></button>
          </SectionTitle>
          <HBars rows={empRows} fmt={(v)=>v} max={100} />
        </div>
      </div>

      {/* SOP knowledge & retention */}
      <div>
        <SectionTitle eyebrow="AI Training Quiz" title="SOP knowledge & retention">
          <span className="chip" style={{ height: 26 }}><I.brain size={13} /> {ret.quizzesToday} quizzes today</span>
        </SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 20, alignItems: 'stretch' }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 4 }}>Retention trend · 8 weeks</div>
                <div style={{ fontSize: 15, fontWeight: 540 }}>Average knowledge score</div>
              </div>
              <div style={{ display: 'flex', gap: 18 }}>
                {[['Avg knowledge', ret.avgKnowledge + '%'], ['Pass rate', ret.passRate + '%'], ['Retraining', ret.needRetraining]].map(([l, v]) => (
                  <div key={l} style={{ textAlign: 'right' }}>
                    <div className="mono tnum" style={{ fontSize: 20, fontWeight: 600, color: l === 'Retraining' ? 'var(--crit)' : 'var(--fg)' }}>{v}</div>
                    <div className="eyebrow" style={{ fontSize: 9, marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <LineChart labels={['W1','W2','W3','W4','W5','W6','W7','W8']} yMin={60} yMax={100} fmt={(v)=>v+'%'} h={200}
              series={[{ data: ret.trend, color: 'var(--fg)', fill: true }]} />
            <p style={{ margin: '16px 0 0', fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.5 }}>
              Knowledge retention up <span className="mono" style={{ color: 'var(--good)' }}>+9 pts</span> since AI quizzing began — employees now pass a check before performing each task.
            </p>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Retention by SOP</div>
            <div style={{ fontSize: 15, fontWeight: 540, marginBottom: 18 }}>Which SOPs stick</div>
            <HBars rows={ret.bySop.map((s) => ({ label: s.sop, value: s.retention, color: scoreColor(s.retention) }))} />
            <div style={{ display: 'flex', gap: 8, marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <I.spark size={14} style={{ color: 'var(--fg-2)', flex: 'none', marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--fg-2)' }}>
                <b style={{ color: 'var(--fg)' }}>HVAC Fault Triage</b> and <b style={{ color: 'var(--fg)' }}>Pool Chemical Logging</b> retain poorly — AI has queued refreshers and re-quizzes.
              </p>
            </div>
          </div>
        </div>

        {/* retraining queue */}
        <div className="card" style={{ marginTop: 16, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--crit)' }} />
            <span style={{ fontSize: 13, fontWeight: 540 }}>Employees who need retraining</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', marginLeft: 'auto' }}>{retrain.length} flagged</span>
          </div>
          {retrain.map((r, i) => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.6fr 0.7fr 1.8fr auto', gap: 14, alignItems: 'center', padding: '12px 18px', borderBottom: i < retrain.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                <Av initials={r.initials} size={32} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.emp}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>quizzed {r.when}</div>
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--fg-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sop}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--crit)' }}>missed {r.missed.length}</div>
              </div>
              <span className="mono tnum" style={{ fontSize: 14, fontWeight: 600, color: 'var(--crit)' }}>{r.score}/{r.total}</span>
              <span style={{ fontSize: 11.5, color: 'var(--fg-3)', lineHeight: 1.4 }}>{r.rec}</span>
              <button className="btn btn-sm"><I.send size={13} /> Refresher</button>
            </div>
          ))}
        </div>
      </div>

      {/* training lift cards */}
      <div>
        <SectionTitle eyebrow="Training effectiveness" title="What's moving the numbers" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {a.trainingLift.map((t, i) => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="mono tnum" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-.03em', color: i === 0 ? 'var(--good)' : 'var(--fg)' }}>{t.val}</span>
                <span className="mono" style={{ fontSize: 16, color: 'var(--fg-3)' }}>{i === 0 ? '%' : '%'}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 8 }}>{t.label}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 3 }}>{t.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Analytics });
