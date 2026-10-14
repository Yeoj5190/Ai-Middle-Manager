/* AI MIDDLE MANAGER — AI Conversations */

const CH = {
  Voice:    { icon: 'phone', c: 'var(--info)' },
  WhatsApp: { icon: 'chat',  c: 'var(--good)' },
  Telegram: { icon: 'send',  c: 'var(--info)' },
  SMS:      { icon: 'chat',  c: 'var(--fg-3)' },
};
const SENT = { positive: 'var(--good)', neutral: 'var(--fg-3)', urgent: 'var(--crit)' };

function ConvRow({ c, active, onClick }) {
  const ch = CH[c.channel]; const Ico = I[ch.icon];
  return (
    <button onClick={onClick}
      style={{ display: 'flex', gap: 11, width: '100%', textAlign: 'left', padding: '13px 16px', border: 'none',
        borderBottom: '1px solid var(--border)', borderLeft: `2px solid ${active ? 'var(--fg)' : 'transparent'}`,
        background: active ? 'var(--hover)' : 'transparent', cursor: 'pointer', font: 'inherit', transition: 'background .12s' }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--hover)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
      <div style={{ position: 'relative', flex: 'none' }}>
        <Av initials={c.initials} size={36} />
        <span style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 99, background: 'var(--surface)', border: '1px solid var(--border-2)', display: 'grid', placeContent: 'center', color: ch.c }}>
          <Ico size={9} sw={2} />
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.emp}</span>
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{c.when}</span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-2)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.topic}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
          <span className="tag" style={{ fontSize: 9.5 }}>{c.channel}</span>
          {c.escalated && <span className="chip crit" style={{ height: 17, fontSize: 9.5 }}>escalated</span>}
        </div>
      </div>
    </button>
  );
}

function Bubble({ m }) {
  const ai = m.who === 'ai';
  return (
    <div style={{ display: 'flex', justifyContent: ai ? 'flex-start' : 'flex-end' }}>
      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: ai ? 'flex-start' : 'flex-end' }}>
        <span className="mono" style={{ fontSize: 9.5, color: 'var(--fg-4)', padding: '0 4px' }}>{ai ? 'AI Manager' : 'Employee'}</span>
        <div style={{ fontSize: 13, lineHeight: 1.5, padding: '9px 13px', borderRadius: ai ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
          background: ai ? 'var(--fg)' : 'var(--surface-2)', color: ai ? 'var(--bg)' : 'var(--fg)',
          border: ai ? 'none' : '1px solid var(--border)' }}>{m.t}</div>
      </div>
    </div>
  );
}

function ConvDetail({ c }) {
  const ch = CH[c.channel]; const Ico = I[ch.icon];
  return (
    <div className="card fade-up" key={c.id} style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Av initials={c.initials} size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 540 }}>{c.emp}</div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ico size={11} style={{ color: ch.c }} /> {c.channel} · {c.when} {c.dur !== '—' && `· ${c.dur}`}
          </div>
        </div>
        <span className="chip" style={{ color: SENT[c.sentiment], borderColor: `color-mix(in oklab,${SENT[c.sentiment]} 35%,transparent)`, height: 24, textTransform: 'capitalize' }}><span className="dot" />{c.sentiment}</span>
      </div>

      {/* AI summary strip */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ width: 22, height: 22, flex: 'none', borderRadius: 7, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.spark size={13} /></div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 5 }}>AI summary</div>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>{c.summary}</p>
          </div>
        </div>
      </div>

      {/* transcript */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {c.channel === 'Voice' && (
          <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 11, background: 'var(--surface-2)' }}>
            <button className="btn btn-icon" style={{ width: 30, height: 30, borderRadius: 99 }}><I.phone size={14} /></button>
            <div style={{ flex: 1, display: 'flex', gap: 2, alignItems: 'center', height: 24 }}>
              {Array.from({ length: 48 }).map((_, i) => (
                <span key={i} style={{ flex: 1, height: `${20 + Math.sin(i * 1.3) * 14 + (i % 3) * 6}%`, minHeight: 3, background: 'var(--border-strong)', borderRadius: 2 }} />
              ))}
            </div>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{c.dur}</span>
          </div>
        )}
        {c.transcript.map((m, i) => <Bubble key={i} m={m} />)}
      </div>

      {/* actions taken */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
        <div className="eyebrow" style={{ marginBottom: 9 }}>AI actions taken</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {c.actions.map((a, i) => (
            <span key={i} className="chip" style={{ height: 26, color: 'var(--fg-2)' }}><I.check size={12} sw={2.4} style={{ color: 'var(--good)' }} /> {a}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Conversations() {
  const { conversations } = window.AMM;
  const [filter, setFilter] = useState('All');
  const [sel, setSel] = useState(conversations[0].id);
  const channels = ['All', 'Voice', 'WhatsApp', 'Telegram', 'SMS'];
  const list = filter === 'All' ? conversations : conversations.filter((c) => c.channel === filter);
  const cur = conversations.find((c) => c.id === sel) || list[0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: 'calc(100vh - 140px)', minHeight: 580 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {channels.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className="btn btn-sm"
            style={{ height: 30, background: filter === c ? 'var(--fg)' : 'var(--surface-2)', color: filter === c ? 'var(--bg)' : 'var(--fg-2)', borderColor: filter === c ? 'var(--fg)' : 'var(--border-2)' }}>
            {c !== 'All' && (() => { const Ico = I[CH[c].icon]; return <Ico size={13} />; })()} {c}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{list.length} conversations today</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: 16, flex: 1, minHeight: 0 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {list.map((c) => <ConvRow key={c.id} c={c} active={c.id === (cur && cur.id)} onClick={() => setSel(c.id)} />)}
          </div>
        </div>
        {cur && <ConvDetail c={cur} />}
      </div>
    </div>
  );
}

Object.assign(window, { Conversations });
