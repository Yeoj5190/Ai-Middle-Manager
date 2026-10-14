/* AI MIDDLE MANAGER — AI Quality Inspection */

function CheckLine({ c }) {
  return (
    <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ width: 20, height: 20, flex: 'none', borderRadius: 6, marginTop: 1, display: 'grid', placeContent: 'center',
        background: c.pass ? 'var(--good-soft)' : 'var(--crit-soft)', color: c.pass ? 'var(--good)' : 'var(--crit)' }}>
        {c.pass ? <I.check size={13} sw={2.6} /> : <I.close size={12} sw={2.6} />}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: c.pass ? 400 : 500 }}>{c.label}</div>
        {c.note && <div style={{ fontSize: 11.5, color: 'var(--crit)', marginTop: 3 }}>{c.note}</div>}
      </div>
    </div>
  );
}

function Quality() {
  const qi = window.AMM.inspection;
  const passed = qi.checks.filter((c) => c.pass).length;
  const queue = [
    { room: 'Room 14', loc: 'Balan Village', type: 'Bed Making', result: 'needs-revision', who: 'BR', active: true },
    { room: 'Room 7',  loc: 'Greystanes',    type: 'Bathroom',   result: 'passed', who: 'AK' },
    { room: 'Room 2',  loc: 'Albatross',     type: 'Full turnover', result: 'passed', who: 'LP' },
    { room: 'Lobby',   loc: 'Granville',     type: 'Floor clean', result: 'pending', who: 'JO' },
    { room: 'Room 9',  loc: 'Lalor Park',    type: 'Bed Making', result: 'passed', who: 'DS' },
  ];
  const RES = { passed: { c: 'var(--good)', l: 'Passed' }, 'needs-revision': { c: 'var(--warn)', l: 'Needs revision' }, pending: { c: 'var(--fg-3)', l: 'Analyzing' } };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>
      {/* queue */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 540 }}>Inspection queue</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{queue.length}</span>
        </div>
        {queue.map((q, i) => {
          const r = RES[q.result];
          return (
            <button key={i} style={{ display: 'flex', gap: 11, alignItems: 'center', width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--border)', borderLeft: `2px solid ${q.active ? 'var(--fg)' : 'transparent'}`, background: q.active ? 'var(--hover)' : 'transparent', cursor: 'pointer', font: 'inherit' }}>
              <div className="ph" style={{ width: 38, height: 38, flex: 'none', borderRadius: 8 }}><span style={{ fontSize: 8 }}>img</span></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{q.room}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{q.loc} · {q.type}</div>
              </div>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: r.c, flex: 'none' }} title={r.l} />
            </button>
          );
        })}
      </div>

      {/* main inspection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* header */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <h2 style={{ fontSize: 18, whiteSpace: 'nowrap' }}>{qi.room} · {qi.type}</h2>
              <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>{qi.id}</span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 3 }}>{qi.loc} · submitted by {qi.employee} · {qi.when}</div>
          </div>
          <span style={{ flex: 1 }} />
          <span className="chip warn" style={{ height: 26 }}><span className="dot" /> {RES[qi.result].l}</span>
        </div>

        {/* before / after panes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <I.camera size={15} style={{ color: 'var(--fg-3)' }} />
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>Employee submission</span>
            </div>
            <div className="ph" style={{ aspectRatio: '4/3', borderRadius: 0, border: 'none' }}><span>room photo — as submitted</span></div>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.spark size={12} /></div>
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>AI analysis</span>
              <span style={{ flex: 1 }} />
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{qi.confidence}% confidence</span>
            </div>
            <div className="ph" style={{ aspectRatio: '4/3', borderRadius: 0, border: 'none' }}>
              <span>annotated overlay — detection boxes</span>
              {/* fake detection boxes */}
              <div style={{ position: 'absolute', inset: 0 }}>
                <div style={{ position: 'absolute', left: '20%', top: '34%', width: '46%', height: '30%', border: '1.5px solid var(--good)', borderRadius: 4, boxShadow: '0 0 0 100vmax color-mix(in oklab, var(--good) 4%, transparent) inset' }}>
                  <span className="mono" style={{ position: 'absolute', top: -16, left: 0, fontSize: 9, color: 'var(--good)', background: 'var(--bg)', padding: '1px 4px', borderRadius: 3 }}>sheets ✓</span>
                </div>
                <div style={{ position: 'absolute', left: '40%', top: '20%', width: '30%', height: '20%', border: '1.5px dashed var(--crit)', borderRadius: 4 }}>
                  <span className="mono" style={{ position: 'absolute', top: -16, left: 0, fontSize: 9, color: 'var(--crit)', background: 'var(--bg)', padding: '1px 4px', borderRadius: 3 }}>blanket offset</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* checklist + verdict */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, alignItems: 'start' }}>
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="eyebrow">AI checklist</span>
              <span className="mono tnum" style={{ fontSize: 12, color: 'var(--fg-2)' }}>{passed}/{qi.checks.length} passed</span>
            </div>
            {qi.checks.map((c, i) => <CheckLine key={i} c={c} />)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 20, textAlign: 'center', background: 'var(--surface)' }}>
              <span className="eyebrow">Final result</span>
              <div style={{ margin: '14px 0 6px', fontSize: 24, fontWeight: 600, color: 'var(--warn)', letterSpacing: '-.02em' }}>Needs Revision</div>
              <div className="meter" style={{ marginTop: 12 }}><i style={{ width: `${(passed/qi.checks.length)*100}%`, background: 'var(--warn)' }} /></div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 8 }}>
                <I.spark size={14} style={{ color: 'var(--fg-2)' }} />
                <span className="eyebrow">AI note to employee</span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: 'var(--fg-2)' }}>{qi.aiNote}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Send back</button>
              <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Override ✓</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Quality });
