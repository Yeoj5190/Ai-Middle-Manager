/* AI MIDDLE MANAGER — Escalation Center */

const SEV = {
  critical: { c: 'var(--crit)', soft: 'var(--crit-soft)', label: 'Critical', score: 'P1' },
  high:     { c: 'var(--warn)', soft: 'var(--warn-soft)', label: 'High',     score: 'P2' },
  med:      { c: 'var(--info)', soft: 'color-mix(in oklab, var(--info) 14%, transparent)', label: 'Medium', score: 'P3' },
};

function EscRow({ e, active, onClick }) {
  const s = SEV[e.sev];
  return (
    <button onClick={onClick}
      style={{ display: 'flex', gap: 12, width: '100%', textAlign: 'left', padding: '14px 16px', border: 'none',
        borderLeft: `2px solid ${active ? s.c : 'transparent'}`, borderBottom: '1px solid var(--border)',
        background: active ? 'var(--hover)' : 'transparent', cursor: 'pointer', font: 'inherit', transition: 'background .12s' }}
      onMouseEnter={(ev) => { if (!active) ev.currentTarget.style.background = 'var(--hover)'; }}
      onMouseLeave={(ev) => { if (!active) ev.currentTarget.style.background = 'transparent'; }}>
      <span style={{ width: 9, height: 9, borderRadius: 99, marginTop: 5, flex: 'none', background: s.c, boxShadow: `0 0 0 3px ${s.soft}` }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="mono" style={{ fontSize: 10.5, color: s.c, fontWeight: 600 }}>{s.score}</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)' }}>{e.id}</span>
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{e.when}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 3 }}>{e.loc} · {e.owner}</div>
      </div>
    </button>
  );
}

function EscDetail({ e }) {
  const s = SEV[e.sev];
  return (
    <div className="card fade-up" key={e.id} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span className="chip" style={{ color: s.c, borderColor: `color-mix(in oklab,${s.c} 40%,transparent)`, background: s.soft, height: 24 }}>
            <span className="dot" /> {s.label} · {s.score}
          </span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{e.id}</span>
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{e.when}</span>
        </div>
        <h2 style={{ fontSize: 20, lineHeight: 1.25, letterSpacing: '-.02em', textWrap: 'balance' }}>{e.title}</h2>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: 'var(--fg-2)' }}>
          <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}><I.pin size={13} style={{ color: 'var(--fg-3)' }} />{e.loc}</span>
          <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}><I.users size={13} style={{ color: 'var(--fg-3)' }} />{e.owner}</span>
        </div>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1, overflowY: 'auto' }}>
        {/* AI summary */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.spark size={13} /></div>
            <span className="eyebrow">AI summary</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--fg)', textWrap: 'pretty' }}>{e.summary}</p>
        </div>

        {/* recommended action */}
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Recommended action</div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>{e.action}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn btn-primary btn-sm"><I.check size={14} sw={2.2} /> Approve & dispatch</button>
            <button className="btn btn-sm">Reassign</button>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--fg-3)' }}>Snooze</button>
          </div>
        </div>

        {/* evidence */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Evidence · {e.evidence}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            <div className="ph" style={{ aspectRatio: '4/3' }}><span>photo evidence</span></div>
            <div className="ph" style={{ aspectRatio: '4/3' }}><span>photo evidence</span></div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, padding: 12, background: 'var(--surface-2)' }}>
              <I.phone size={18} style={{ color: 'var(--fg-3)' }} />
              <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>Voice note 0:42</span>
              <div className="meter" style={{ height: 4 }}><i style={{ width: '34%' }} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Escalations() {
  const { escalations } = window.AMM;
  const [sel, setSel] = useState(escalations[0].id);
  const cur = escalations.find((e) => e.id === sel);
  const counts = { critical: escalations.filter(e=>e.sev==='critical').length, high: escalations.filter(e=>e.sev==='high').length, med: escalations.filter(e=>e.sev==='med').length };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, height: 'calc(100vh - 140px)', minHeight: 560 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {Object.entries({ critical: 'Critical', high: 'High', med: 'Medium' }).map(([k, lbl]) => (
          <div key={k} className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 9, flex: 1 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: SEV[k].c }} />
            <span className="mono tnum" style={{ fontSize: 22, fontWeight: 600 }}>{counts[k]}</span>
            <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{lbl}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm"><I.filter size={14} /> All locations</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: 18, flex: 1, minHeight: 0 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 540 }}>Open queue</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{escalations.length} active</span>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {escalations.map((e) => <EscRow key={e.id} e={e} active={e.id === sel} onClick={() => setSel(e.id)} />)}
          </div>
        </div>
        <EscDetail e={cur} />
      </div>
    </div>
  );
}

Object.assign(window, { Escalations });
