/* AI MIDDLE MANAGER — SOP Knowledge Base */

const SOP_TYPE = { Document: 'doc', Video: 'video', Checklist: 'checklist', Image: 'image' };
const CAT_LIST = ['All', 'Housekeeping', 'Compliance', 'Maintenance'];

function SopCard({ s, onOpen }) {
  const Ico = I[SOP_TYPE[s.type]] || I.doc;
  const sc = s.success >= 90 ? 'var(--good)' : s.success >= 80 ? 'var(--warn)' : 'var(--crit)';
  return (
    <button onClick={() => onOpen(s)} className="card" style={{ padding: 0, overflow: 'hidden', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', background: 'var(--surface)', transition: 'border-color .15s, transform .08s' }}
      onMouseEnter={(e)=>{e.currentTarget.style.borderColor='var(--border-strong)';e.currentTarget.style.transform='translateY(-1px)';}}
      onMouseLeave={(e)=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none';}}>
      <div className="ph" style={{ height: 96, borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border)' }}>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Ico size={22} style={{ color: 'var(--fg-3)' }} /> {s.type}
        </span>
        {s.highlight && <span className="chip good" style={{ position: 'absolute', top: 10, right: 10, height: 20 }}>updated</span>}
        {s.risk && <span className="chip crit" style={{ position: 'absolute', top: 10, right: 10, height: 20 }}>at risk</span>}
      </div>
      <div style={{ padding: 15, display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{s.id}</span>
            <span className="tag" style={{ fontSize: 9.5 }}>{s.cat}</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 540, letterSpacing: '-.01em', textWrap: 'pretty' }}>{s.title}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 'auto' }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: sc }} />
          <span className="mono tnum" style={{ fontSize: 12, color: sc, fontWeight: 600 }}>{s.success}%</span>
          <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>success rate</span>
        </div>
        <div className="meter" style={{ height: 5 }}><i style={{ width: `${s.success}%`, background: sc }} /></div>
        <div style={{ display: 'flex', gap: 14, fontSize: 10.5, color: 'var(--fg-3)', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <span className="mono"><b style={{ color: 'var(--fg-2)' }}>{s.usage}</b> uses</span>
          <span className="mono"><b style={{ color: 'var(--fg-2)' }}>{s.questions}</b> Q's</span>
          <span className="mono"><b style={{ color: s.incidents ? 'var(--crit)' : 'var(--fg-2)' }}>{s.incidents}</b> incidents</span>
          <span style={{ flex: 1 }} />
          <span className="mono">{s.updated}</span>
        </div>
      </div>
    </button>
  );
}

function SopDetail({ s, onClose }) {
  const Ico = I[SOP_TYPE[s.type]] || I.doc;
  const steps = Array.from({ length: Math.min(s.steps, 6) }, (_, i) => i);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', padding: 24, background: 'color-mix(in oklab, var(--bg) 55%, transparent)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="card fade-up" style={{ width: 'min(620px, 100%)', maxHeight: '88vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeContent: 'center' }}><Ico size={19} style={{ color: 'var(--fg-2)' }} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{s.title}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{s.id} · {s.cat} · {s.type} · {s.steps} steps</div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><I.close size={16} /></button>
        </div>
        <div style={{ padding: 22, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[['Usage', s.usage, ''], ['Success rate', s.success, '%'], ['Open questions', s.questions, '']].map(([l, v, u]) => (
              <div key={l} className="card" style={{ padding: 14, background: 'var(--surface-2)' }}>
                <div className="mono tnum" style={{ fontSize: 22, fontWeight: 600 }}>{v}{u}</div>
                <div className="eyebrow" style={{ fontSize: 9.5, marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
          <div className="ph" style={{ height: 150 }}><span>{s.type === 'Video' ? 'training video — 4:12' : 'SOP document preview'}</span></div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Procedure steps</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {steps.map((i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="mono" style={{ width: 24, height: 24, flex: 'none', borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeContent: 'center', fontSize: 11, color: 'var(--fg-2)' }}>{i + 1}</span>
                  <div className="ph" style={{ flex: 1, height: 30, borderRadius: 7 }}><span style={{ fontSize: 9 }}>step detail</span></div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 14, display: 'flex', gap: 9, background: 'var(--surface-2)' }}>
            <I.spark size={15} style={{ color: 'var(--fg-2)', flex: 'none', marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>
              AI suggests adding a photo-verification step after step 4 — 12 employees asked about this stage in the last fortnight.
            </p>
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm"><I.plus size={14} /> Edit SOP</button>
          <button className="btn btn-sm"><I.send size={13} /> Push to team</button>
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', alignSelf: 'center' }}>Updated {s.updated}</span>
        </div>
      </div>
    </div>
  );
}

function Sops() {
  const { sops } = window.AMM;
  const [cat, setCat] = useState('All');
  const [open, setOpen] = useState(null);
  const list = cat === 'All' ? sops : sops.filter((s) => s.cat === cat);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--surface-2)', borderRadius: 9, border: '1px solid var(--border)' }}>
          {CAT_LIST.map((c) => (
            <button key={c} onClick={() => setCat(c)} className="btn btn-sm" style={{ height: 28, border: 'none', background: cat === c ? 'var(--active)' : 'transparent', color: cat === c ? 'var(--fg)' : 'var(--fg-3)' }}>{c}</button>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <button className="btn btn-sm"><I.search size={14} /> Search SOPs</button>
        <button className="btn btn-primary btn-sm"><I.plus size={14} /> New SOP</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
        {list.map((s) => <SopCard key={s.id} s={s} onOpen={setOpen} />)}
      </div>

      {open && <SopDetail s={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

Object.assign(window, { Sops });
