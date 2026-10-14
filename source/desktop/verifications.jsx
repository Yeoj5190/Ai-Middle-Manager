/* AI MIDDLE MANAGER — AI Knowledge Verification Calls (manager desktop) */

const VREADY = {
  ready:       { c: 'var(--good)', soft: 'var(--good-soft)', label: 'Ready to work independently', short: 'Ready' },
  borderline:  { c: 'var(--warn)', soft: 'var(--warn-soft)', label: 'Borderline — re-check needed', short: 'Borderline' },
  'not-ready': { c: 'var(--crit)', soft: 'var(--crit-soft)', label: 'Not ready — retraining required', short: 'Not ready' },
};
const VQUAL = { strong: { c: 'var(--good)', l: 'Strong' }, partial: { c: 'var(--warn)', l: 'Partial' }, weak: { c: 'var(--crit)', l: 'Weak' } };

function VKpi({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: 16, flex: 1, minWidth: 0 }}>
      <div className="eyebrow" style={{ fontSize: 10 }}>{label}</div>
      <div className="mono tnum" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-.02em', marginTop: 8, color: color || 'var(--fg)' }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function CallRow({ c, active, onClick }) {
  const r = VREADY_get(c.readiness);
  return (
    <button onClick={onClick}
      style={{ display: 'flex', gap: 11, width: '100%', textAlign: 'left', padding: '13px 16px', border: 'none',
        borderBottom: '1px solid var(--border)', borderLeft: `2px solid ${active ? r.c : 'transparent'}`,
        background: active ? 'var(--hover)' : 'transparent', cursor: 'pointer', font: 'inherit', transition: 'background .12s' }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--hover)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
      <Av initials={c.initials} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.emp}</span>
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{c.when}</span>
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.sop}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span className="chip" style={{ height: 18, fontSize: 9.5, color: r.c, borderColor: `color-mix(in oklab,${r.c} 35%,transparent)` }}><span className="dot" />{r.short}</span>
          <span className="mono tnum" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>K {c.knowledge} · C {c.confidence}</span>
        </div>
      </div>
    </button>
  );
}

function VREADY_get(k) { return VREADY[k]; }

function Waveform({ n = 72, playing }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 40, flex: 1 }}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} style={{ flex: 1, minWidth: 1.5, borderRadius: 2,
          height: `${18 + Math.abs(Math.sin(i * 0.7)) * 60 + (i % 4) * 6}%`,
          background: i < n * 0.34 ? 'var(--fg)' : 'var(--border-strong)' }} />
      ))}
    </div>
  );
}

function AnnotatedTranscript({ turns }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {turns.map((t, i) => {
        if (t.who === 'ai') {
          return (
            <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, flex: 'none', borderRadius: 7, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.spark size={13} /></div>
              <div style={{ flex: 1 }}>
                {t.kind && t.kind !== 'verdict' && (
                  <span className="mono" style={{ fontSize: 9, color: t.kind === 'coach' || t.kind === 'challenge' ? 'var(--warn)' : 'var(--good)', display: 'block', marginBottom: 3, letterSpacing: '.04em' }}>
                    {t.kind === 'coach' ? '◆ COACHING' : t.kind === 'challenge' ? '◆ CHALLENGING WEAK ANSWER' : t.kind === 'advance' ? '◆ ADVANCING DIFFICULTY' : ''}
                  </span>
                )}
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--fg)' }}>{t.t}</p>
              </div>
            </div>
          );
        }
        const ql = VQUAL[t.quality] || VQUAL.partial;
        return (
          <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', justifyContent: 'flex-end' }}>
            <div style={{ maxWidth: '76%' }}>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)', padding: '9px 13px', borderRadius: '12px 4px 12px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>{t.t}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, justifyContent: 'flex-end' }}>
                {t.hesitation && <span className="mono" style={{ fontSize: 9, color: 'var(--warn)' }}>hesitation detected</span>}
                <span className="mono" style={{ fontSize: 9.5, color: ql.c }}>{ql.l.toLowerCase()} answer</span>
                <span className="mono tnum" style={{ fontSize: 9.5, color: 'var(--fg-3)' }}>conf {Math.round(t.confidence * 100)}%</span>
              </div>
            </div>
            <div style={{ width: 24, height: 24, flex: 'none', borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeContent: 'center' }}><I.users size={12} style={{ color: 'var(--fg-3)' }} /></div>
          </div>
        );
      })}
    </div>
  );
}

function CallDetail({ c }) {
  const r = VREADY_get(c.readiness);
  const hasScript = c.id === window.AMM.verificationScript.emp.toLowerCase().split(' ')[0] || c.id === 'bianca';
  const turns = c.id === 'bianca' ? window.AMM.verificationScript.turns : null;
  return (
    <div className="card fade-up" key={c.id} style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* header */}
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 13 }}>
        <Av initials={c.initials} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 560 }}>{c.emp}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{c.sop} · {c.when} · {c.dur}</div>
        </div>
        <span className="chip" style={{ height: 26, color: r.c, borderColor: `color-mix(in oklab,${r.c} 40%,transparent)`, background: `color-mix(in oklab,${r.c} 12%,transparent)` }}><span className="dot" /> {r.short}</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* recording player */}
        <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface-2)' }}>
          <button className="btn btn-icon" style={{ width: 38, height: 38, borderRadius: 99, flex: 'none', background: 'var(--fg)', color: 'var(--bg)', border: 'none' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </button>
          <Waveform />
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', flex: 'none' }}>{c.dur}</span>
          <button className="btn btn-icon btn-ghost" title="Download recording" style={{ flex: 'none' }}><I.arrow size={15} style={{ transform: 'rotate(90deg)' }} /></button>
        </div>

        {/* scores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[['Knowledge', c.knowledge, '%'], ['Confidence', c.confidence, '%']].map(([l, v, u]) => (
            <div key={l} className="card" style={{ padding: 15, background: 'var(--surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="eyebrow" style={{ fontSize: 9.5 }}>{l}</span>
                <span className="mono tnum" style={{ fontSize: 19, fontWeight: 600, color: scoreColor(v) }}>{v}{u}</span>
              </div>
              <div className="meter" style={{ marginTop: 9 }}><i style={{ width: `${v}%`, background: scoreColor(v) }} /></div>
            </div>
          ))}
          <div className="card" style={{ padding: 15, background: r.soft || 'var(--surface)', border: `1px solid color-mix(in oklab, ${r.c} 28%, transparent)`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="eyebrow" style={{ fontSize: 9.5 }}>SOP readiness</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: r.c, marginTop: 6, lineHeight: 1.2 }}>{r.short}</span>
          </div>
        </div>

        {/* AI analysis summary */}
        <div className="card" style={{ padding: 16, background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
            <I.spark size={14} style={{ color: 'var(--fg-2)' }} />
            <span className="eyebrow" style={{ fontSize: 9.5 }}>AI assessment</span>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)', textWrap: 'pretty' }}>{c.summary}</p>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {c.flags.map((f, i) => (
              <span key={i} className="chip" style={{ height: 24, color: f.includes('alert') || f.includes('Failed') || f.includes('twice') ? 'var(--crit)' : 'var(--fg-2)' }}>{f}</span>
            ))}
          </div>
        </div>

        {/* improvement over time */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span className="eyebrow" style={{ fontSize: 9.5 }}>Improvement over time · knowledge score</span>
            <Delta value={Math.abs(c.trend[c.trend.length - 1] - c.trend[0]) + ' pts'} dir={c.trend[c.trend.length - 1] >= c.trend[0] ? 'up' : 'down'} />
          </div>
          <VBars data={c.trend} labels={['4w', '3w', '2w', 'now']} h={96} color={scoreColor(c.knowledge)} />
        </div>

        {/* transcript */}
        <div>
          <div className="eyebrow" style={{ fontSize: 9.5, marginBottom: 12 }}>Call transcript · AI annotations</div>
          {turns
            ? <AnnotatedTranscript turns={turns} />
            : <div className="card" style={{ padding: 16, color: 'var(--fg-3)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 9 }}><I.mic size={15} /> Full annotated transcript available — open the recording above.</div>}
        </div>
      </div>

      {/* action footer */}
      <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
        {c.readiness === 'ready'
          ? <span className="chip good" style={{ height: 30 }}><I.check size={13} sw={2.4} /> Cleared to work independently{c.follow ? ` · ${c.follow}-day follow-up` : ''}</span>
          : <>
              <button className="btn btn-primary btn-sm"><I.send size={13} /> Send retraining</button>
              <button className="btn btn-sm"><I.replay size={13} /> Schedule re-call</button>
            </>}
        <span style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--fg-2)' }}>Open profile <I.arrow size={13} /></button>
      </div>
    </div>
  );
}

function Verifications() {
  const calls = window.AMM.verificationCalls;
  const v = window.AMM.verification;
  const [sel, setSel] = useState(calls[0].id);
  const cur = calls.find((c) => c.id === sel);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* intro + KPIs */}
      <div className="card fade-up" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: .5, maskImage: 'radial-gradient(120% 120% at 100% 0%, black, transparent 70%)' }} />
        <div style={{ position: 'relative', width: 30, height: 30, flex: 'none', borderRadius: 8, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.mic size={16} /></div>
        <p style={{ position: 'relative', margin: 0, fontSize: 13.5, color: 'var(--fg-2)', flex: 1, lineHeight: 1.5, textWrap: 'pretty' }}>
          The AI Operations Manager calls each employee for a <span style={{ color: 'var(--fg)', fontWeight: 540 }}>live verbal competency check</span> after training — verifying they genuinely understand the SOP before working independently.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <VKpi label="Calls today" value={v.callsToday} sub="across 7 locations" />
        <VKpi label="Ready rate" value={v.readyRate + '%'} sub="cleared to work solo" color="var(--good)" />
        <VKpi label="Avg confidence" value={v.avgConfidence + '%'} sub="verbal delivery" />
        <VKpi label="Need retraining" value={v.notReady} sub="manager alerted" color="var(--crit)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: 18, height: 'calc(100vh - 280px)', minHeight: 560 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 540 }}>Recent calls</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{calls.length}</span>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {calls.map((c) => <CallRow key={c.id} c={c} active={c.id === sel} onClick={() => setSel(c.id)} />)}
          </div>
        </div>
        <CallDetail c={cur} />
      </div>
    </div>
  );
}

Object.assign(window, { Verifications });
