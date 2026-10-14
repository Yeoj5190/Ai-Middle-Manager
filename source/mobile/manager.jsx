/* AI MIDDLE MANAGER — Mobile MANAGER app (John Mercer) */
const { useState, useEffect, useRef } = React;

const MGR = { name: 'John Mercer', initials: 'JM', role: 'Regional Manager' };

/* ---- shell (dark canvas inside bezel) ---- */
function MScreen({ children, pad = true, style }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', color: 'var(--fg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style }}>
      <div style={{ height: 54, flex: 'none' }} />
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: pad ? '0 18px' : 0, WebkitOverflowScrolling: 'touch' }}>{children}</div>
    </div>
  );
}

function MAppBar({ title, right }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 54, paddingTop: 4, zIndex: 25, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'color-mix(in oklab, var(--bg) 82%, transparent)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.01em' }}>{title}</span>
      {right && <div style={{ position: 'absolute', right: 14, top: 13 }}>{right}</div>}
    </div>
  );
}

function MTabBar({ tab, setTab }) {
  const tabs = [
    { id: 'home', icon: 'grid', label: 'Overview' },
    { id: 'alerts', icon: 'alert', label: 'Alerts', badge: 4 },
    { id: 'ask', icon: 'spark', label: '', big: true },
    { id: 'sites', icon: 'pin', label: 'Sites' },
    { id: 'team', icon: 'users', label: 'Team' },
  ];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 86, zIndex: 30,
      background: 'linear-gradient(to top, var(--bg) 60%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 12px 22px' }}>
      {tabs.map((t) => {
        const Ico = I[t.icon];
        const active = tab === t.id;
        if (t.big) return (
          <button key={t.id} onClick={() => setTab('ask')} style={{ width: 56, height: 56, borderRadius: 99, border: 'none', background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px -6px rgba(0,0,0,.6)', marginTop: -18 }}>
            <Ico size={22} />
          </button>
        );
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 8px', color: active ? 'var(--fg)' : 'var(--fg-4)', flex: 1, position: 'relative' }}>
            <span style={{ position: 'relative' }}>
              <Ico size={21} />
              {t.badge && <span className="mono tnum" style={{ position: 'absolute', top: -6, right: -10, minWidth: 15, height: 15, padding: '0 4px', borderRadius: 99, background: 'var(--crit)', color: '#fff', fontSize: 9, display: 'grid', placeContent: 'center', boxShadow: '0 0 0 2px var(--bg)' }}>{t.badge}</span>}
            </span>
            <span className="mono" style={{ fontSize: 9, letterSpacing: '.02em' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* mini sparkline reused via window.Sparkline */

/* ───────── OVERVIEW (home) ───────── */
function HomeM({ setTab, openEsc, openVerify, openVCall }) {
  const { briefing, stats, insights, locations, verification, verificationCalls } = window.AMM;
  const tiles = stats.slice(0, 4);
  const notReady = verificationCalls.find((c) => c.readiness === 'not-ready');
  return (
    <MScreen>
      <MAppBar title="Overview" right={<Av initials={MGR.initials} size={28} online />} />
      <div style={{ paddingTop: 18, paddingBottom: 110 }}>
        <div style={{ marginBottom: 16 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>Tue 3 Jun · 7 locations · 26 staff</div>
          <h2 style={{ fontSize: 25, marginTop: 6, letterSpacing: '-.02em' }}>Morning, John.</h2>
        </div>

        {/* AI briefing */}
        <div className="card" style={{ padding: 16, marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: .5, maskImage: 'radial-gradient(120% 100% at 100% 0%, black, transparent 70%)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.spark size={13} /></div>
              <span className="eyebrow" style={{ fontSize: 10 }}>AI Operations Briefing</span>
              <span className="chip good" style={{ height: 18, fontSize: 9.5, marginLeft: 'auto' }}><span className="dot" />Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)', textWrap: 'pretty' }}>
              Operations across all 7 locations are running smoothly. <b style={{ color: 'var(--fg)' }}>42 tasks</b> completed today, 5 need review. 1 critical maintenance issue at Granville needs escalation.
            </p>
          </div>
        </div>

        {/* live ops tiles */}
        <span className="eyebrow" style={{ fontSize: 10 }}>Live operations</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 11, marginBottom: 20 }}>
          {tiles.map((s) => (
            <div key={s.id} className="card" style={{ padding: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="eyebrow" style={{ fontSize: 8.5 }}>{s.label}</span>
                <Delta value={s.delta} dir={s.dir} invert={s.invert} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <span className="mono tnum" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-.02em' }}>{s.value}</span>
                <Sparkline data={s.spark} w={52} h={20} invert={s.invert} />
              </div>
            </div>
          ))}
        </div>

        {/* what needs you */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
          <span className="eyebrow" style={{ fontSize: 10 }}>What needs you</span>
          <button onClick={() => setTab('alerts')} className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', background: 'none', border: 'none' }}>All</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {insights.slice(0, 3).map((ins, i) => {
            const map = { crit: { c: 'var(--crit)', ic: 'alert' }, warn: { c: 'var(--warn)', ic: 'trend' }, good: { c: 'var(--good)', ic: 'check' } };
            const m = map[ins.sev]; const Ico = I[m.ic];
            return (
              <button key={i} onClick={() => ins.sev !== 'good' ? setTab('alerts') : null} className="card" style={{ padding: 13, display: 'flex', gap: 11, textAlign: 'left', width: '100%', cursor: 'pointer', background: 'var(--surface)', alignItems: 'flex-start' }}>
                <span style={{ width: 26, height: 26, flex: 'none', borderRadius: 8, display: 'grid', placeContent: 'center', background: `color-mix(in oklab, ${m.c} 14%, transparent)`, color: m.c }}><Ico size={14} /></span>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg-2)', flex: 1, textWrap: 'pretty' }}>{ins.text}</p>
              </button>
            );
          })}
        </div>

        {/* knowledge verification */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
          <span className="eyebrow" style={{ fontSize: 10 }}>Knowledge verification</span>
          <button onClick={openVerify} className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', background: 'none', border: 'none' }}>All</button>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 24, height: 24, flex: 'none', borderRadius: 7, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.mic size={13} /></div>
            <span style={{ fontSize: 12.5, fontWeight: 540, flex: 1 }}>AI verbal checks</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{verification.callsToday} today</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
            {[['Ready rate', verification.readyRate + '%', 'var(--good)'], ['Avg conf.', verification.avgConfidence + '%', 'var(--fg)'], ['Retrain', verification.notReady, 'var(--crit)']].map(([l, v, c], i) => (
              <div key={l} style={{ padding: '12px 12px', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <div className="mono tnum" style={{ fontSize: 18, fontWeight: 600, color: c }}>{v}</div>
                <div className="eyebrow" style={{ fontSize: 8, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          {notReady && (
            <button onClick={() => openVCall(notReady)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '11px 14px', borderTop: '1px solid var(--border)', background: 'var(--crit-soft)', border: 'none', borderRadius: 0, cursor: 'pointer', font: 'inherit' }}>
              <Av initials={notReady.initials} size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}><b>{notReady.emp}</b> not ready</div>
                <div className="mono" style={{ fontSize: 9.5, color: 'var(--fg-3)' }}>{notReady.sop} · retraining alerted</div>
              </div>
              <span className="mono tnum" style={{ fontSize: 12, fontWeight: 600, color: 'var(--crit)' }}>{notReady.knowledge}</span>
              <I.arrow size={14} style={{ color: 'var(--crit)' }} />
            </button>
          )}
        </div>

        {/* location health quick */}
        <span className="eyebrow" style={{ fontSize: 10 }}>Location health</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 11 }}>
          {locations.slice(0, 4).map((l) => {
            const health = Math.round((l.quality + l.compliance) / 2);
            const hc = scoreColor(health);
            return (
              <button key={l.id} onClick={() => setTab('sites')} className="card" style={{ padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', width: '100%', cursor: 'pointer', background: 'var(--surface)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: hc, flex: 'none' }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</span>
                {l.issues > 0 && <span className="chip crit" style={{ height: 18, fontSize: 9.5 }}>{l.issues}</span>}
                <span className="mono tnum" style={{ fontSize: 12, color: hc, fontWeight: 600 }}>{health}%</span>
              </button>
            );
          })}
        </div>
      </div>
    </MScreen>
  );
}

/* ───────── ALERTS (escalations) ───────── */
const MSEV = { critical: { c: 'var(--crit)', s: 'P1' }, high: { c: 'var(--warn)', s: 'P2' }, med: { c: 'var(--info)', s: 'P3' } };
function AlertsM({ openEsc }) {
  const { escalations } = window.AMM;
  const counts = { critical: escalations.filter(e=>e.sev==='critical').length, high: escalations.filter(e=>e.sev==='high').length, med: escalations.filter(e=>e.sev==='med').length };
  return (
    <MScreen>
      <MAppBar title="Escalations" />
      <div style={{ paddingTop: 16, paddingBottom: 110 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {Object.entries({ critical: 'Critical', high: 'High', med: 'Medium' }).map(([k, lbl]) => (
            <div key={k} className="card" style={{ flex: 1, padding: '11px 8px', textAlign: 'center' }}>
              <div className="mono tnum" style={{ fontSize: 20, fontWeight: 600, color: MSEV[k].c }}>{counts[k]}</div>
              <div className="eyebrow" style={{ fontSize: 8.5, marginTop: 2 }}>{lbl}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {escalations.map((e) => {
            const sv = MSEV[e.sev];
            return (
              <button key={e.id} onClick={() => openEsc(e)} className="card" style={{ padding: 14, textAlign: 'left', width: '100%', cursor: 'pointer', background: 'var(--surface)', borderLeft: `2px solid ${sv.c}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <span className="mono" style={{ fontSize: 10, color: sv.c, fontWeight: 600 }}>{sv.s}</span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{e.id}</span>
                  <span style={{ flex: 1 }} />
                  <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{e.when}</span>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 540, lineHeight: 1.3, marginBottom: 6, textWrap: 'pretty' }}>{e.title}</div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{e.loc} · {e.owner}</div>
              </button>
            );
          })}
        </div>
      </div>
    </MScreen>
  );
}

/* escalation detail (state phone + drill-in) */
function EscDetailM({ e, onBack }) {
  const sv = MSEV[e.sev];
  return (
    <MScreen>
      <MAppBar title="Escalation" right={onBack ? <button onClick={onBack} className="mono" style={{ background: 'none', border: 'none', color: 'var(--fg-2)', fontSize: 12 }}>Done</button> : null} />
      <div style={{ paddingTop: 16, paddingBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span className="chip" style={{ color: sv.c, borderColor: `color-mix(in oklab,${sv.c} 40%,transparent)`, background: `color-mix(in oklab,${sv.c} 14%,transparent)`, height: 22 }}><span className="dot" /> {sv.s} · {e.sev}</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginLeft: 'auto' }}>{e.when}</span>
        </div>
        <h2 style={{ fontSize: 19, lineHeight: 1.25, letterSpacing: '-.01em', marginBottom: 8, textWrap: 'balance' }}>{e.title}</h2>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--fg-2)', marginBottom: 18 }}>
          <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}><I.pin size={13} style={{ color: 'var(--fg-3)' }} />{e.loc}</span>
          <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}><I.users size={13} style={{ color: 'var(--fg-3)' }} />{e.owner}</span>
        </div>

        <div className="card" style={{ padding: 15, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.spark size={12} /></div>
            <span className="eyebrow" style={{ fontSize: 9.5 }}>AI summary</span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg)', textWrap: 'pretty' }}>{e.summary}</p>
        </div>

        <div className="card" style={{ padding: 15, marginBottom: 14, background: 'var(--surface-2)' }}>
          <div className="eyebrow" style={{ fontSize: 9.5, marginBottom: 7 }}>Recommended action</div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)' }}>{e.action}</p>
        </div>

        <div className="ph" style={{ height: 110, marginBottom: 16 }}><span>evidence · {e.evidence}</span></div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ flex: 1, height: 46, borderRadius: 12, border: 'none', background: 'var(--fg)', color: 'var(--bg)', fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer' }}><I.check size={16} sw={2.4} /> Approve</button>
          <button style={{ width: 100, height: 46, borderRadius: 12, border: '1px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--fg)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Reassign</button>
        </div>
      </div>
    </MScreen>
  );
}

/* ───────── SITES (locations) ───────── */
function SitesM() {
  const { locations } = window.AMM;
  return (
    <MScreen>
      <MAppBar title="Locations" />
      <div style={{ paddingTop: 16, paddingBottom: 110 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {locations.map((l) => {
            const health = Math.round((l.quality + l.compliance) / 2);
            const hc = scoreColor(health);
            return (
              <div key={l.id} className="card" style={{ padding: 15 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 560, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 2 }}>{l.area}</div>
                  </div>
                  {l.issues > 0
                    ? <span className="chip crit" style={{ height: 20 }}>{l.issues} issue{l.issues>1?'s':''}</span>
                    : <span className="chip good" style={{ height: 20 }}><I.check size={11} sw={2.4} /></span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: hc }} />
                  <span className="mono tnum" style={{ fontSize: 12, color: 'var(--fg-2)' }}>{health}% health</span>
                  <span style={{ flex: 1 }} />
                  <Delta value={Math.abs(l.trend) + '%'} dir={l.trend >= 0 ? 'up' : 'down'} />
                </div>
                <div className="meter" style={{ marginBottom: 11 }}><i style={{ width: `${health}%`, background: hc }} /></div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--fg-3)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><I.users size={12} /><b className="mono tnum" style={{ color: 'var(--fg-2)' }}>{l.staff}</b> on shift</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><I.checklist size={12} /><b className="mono tnum" style={{ color: 'var(--fg-2)' }}>{l.open}</b> open</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MScreen>
  );
}

/* ───────── TEAM (employees) ───────── */
function TeamM() {
  const emps = [...window.AMM.employees].sort((a, b) => b.score - a.score);
  return (
    <MScreen>
      <MAppBar title="Team" />
      <div style={{ paddingTop: 16, paddingBottom: 110 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {emps.map((e) => (
            <div key={e.id} className="card" style={{ padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Av initials={e.initials} size={38} online={e.status === 'on-shift'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{e.role}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono tnum" style={{ fontSize: 16, fontWeight: 600, color: scoreColor(e.score) }}>{e.score}</div>
                <div className="eyebrow" style={{ fontSize: 8 }}>AI score</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MScreen>
  );
}

/* ───────── ASK AI ───────── */
function AskM({ answered }) {
  const suggestions = [
    { icon: 'alert', text: 'What needs my attention right now?' },
    { icon: 'pin', text: 'Why did Granville drop this week?' },
    { icon: 'users', text: 'Who are my top & bottom performers?' },
    { icon: 'scan', text: 'Show failed inspections today' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', color: 'var(--fg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MAppBar title="AI Manager" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '70px 18px 18px', display: 'flex', flexDirection: 'column' }}>
        {!answered ? (
          <>
            <div style={{ textAlign: 'center', margin: '20px 0 26px' }}>
              <div className="amm-orb" style={{ width: 76, height: 76, borderRadius: 99, margin: '0 auto 16px', background: 'radial-gradient(circle at 38% 32%, var(--fg), color-mix(in oklab, var(--fg) 50%, var(--bg)))', boxShadow: '0 0 50px -8px color-mix(in oklab, var(--fg) 40%, transparent)' }} />
              <div style={{ fontSize: 17, fontWeight: 600 }}>Ask your AI Manager</div>
              <p style={{ fontSize: 12.5, color: 'var(--fg-3)', marginTop: 6, lineHeight: 1.5 }}>Monitoring 7 locations · 26 staff · always on</p>
            </div>
            <span className="eyebrow" style={{ fontSize: 10, marginBottom: 10 }}>Suggested</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {suggestions.map((s, i) => {
                const Ico = I[s.icon];
                return (
                  <div key={i} className="card" style={{ padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', background: 'var(--surface)' }}>
                    <Ico size={16} style={{ color: 'var(--fg-3)', flex: 'none' }} />
                    <span style={{ fontSize: 13, flex: 1 }}>{s.text}</span>
                    <I.arrow size={14} style={{ color: 'var(--fg-4)' }} />
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* user q */}
            <div style={{ alignSelf: 'flex-end', maxWidth: '82%', fontSize: 13.5, lineHeight: 1.45, padding: '10px 14px', borderRadius: '14px 4px 14px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              What needs my attention right now?
            </div>
            {/* ai answer */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 26, height: 26, flex: 'none', borderRadius: 8, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.spark size={14} /></div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--fg)', textWrap: 'pretty' }}>
                  <b>Granville is your priority.</b> Room inspections dropped 18%, 3 SOP violations logged, and there are 3 open escalations — including a <span style={{ color: 'var(--crit)' }}>critical HVAC failure</span> with a guest arriving at 15:00.
                </p>
                <div className="card" style={{ padding: 12, marginTop: 12, background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div className="eyebrow" style={{ fontSize: 9 }}>Recommended next steps</div>
                  {['Approve HVAC backup dispatch', 'Reassign Room 12 re-clean to Jamal', 'Schedule coaching for Marcus'].map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 12.5, color: 'var(--fg-2)' }}>
                      <span style={{ width: 16, height: 16, borderRadius: 5, flex: 'none', background: 'var(--good-soft)', color: 'var(--good)', display: 'grid', placeContent: 'center' }}><I.check size={10} sw={2.6} /></span>
                      {t}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button style={{ height: 36, padding: '0 14px', borderRadius: 9, border: 'none', background: 'var(--fg)', color: 'var(--bg)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Open Granville</button>
                  <button style={{ height: 36, padding: '0 14px', borderRadius: 9, border: '1px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--fg)', fontSize: 12.5, cursor: 'pointer' }}>Approve all</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* input bar */}
      <div style={{ flex: 'none', padding: '10px 16px 30px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 6px 0 16px', borderRadius: 99, border: '1px solid var(--border-2)', background: 'var(--surface)' }}>
          <span style={{ flex: 1, fontSize: 13.5, color: 'var(--fg-4)' }}>Ask anything…</span>
          <button style={{ width: 32, height: 32, borderRadius: 99, border: 'none', background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center', cursor: 'pointer' }}><I.send size={15} /></button>
        </div>
      </div>
    </div>
  );
}

/* ───────── KNOWLEDGE VERIFICATION (mobile manager) ───────── */
const MREADY = {
  ready:       { c: 'var(--good)', soft: 'var(--good-soft)', label: 'Ready to work independently', short: 'Ready' },
  borderline:  { c: 'var(--warn)', soft: 'var(--warn-soft)', label: 'Borderline — re-check', short: 'Borderline' },
  'not-ready': { c: 'var(--crit)', soft: 'var(--crit-soft)', label: 'Not ready — retraining', short: 'Not ready' },
};
const MVQUAL = { strong: { c: 'var(--good)', l: 'strong' }, partial: { c: 'var(--warn)', l: 'partial' }, weak: { c: 'var(--crit)', l: 'weak' } };

function VCallRowM({ c, onClick }) {
  const r = MREADY[c.readiness];
  return (
    <button onClick={onClick} className="card" style={{ padding: '12px 13px', display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', width: '100%', cursor: 'pointer', background: 'var(--surface)', borderLeft: `2px solid ${r.c}` }}>
      <Av initials={c.initials} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.emp}</span>
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 9.5, color: 'var(--fg-3)' }}>{c.when}</span>
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.sop}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span className="chip" style={{ height: 17, fontSize: 9, color: r.c, borderColor: `color-mix(in oklab,${r.c} 35%,transparent)` }}><span className="dot" />{r.short}</span>
          <span className="mono tnum" style={{ fontSize: 10, color: 'var(--fg-3)' }}>K {c.knowledge} · C {c.confidence}</span>
        </div>
      </div>
      <I.arrow size={15} style={{ color: 'var(--fg-4)', flex: 'none' }} />
    </button>
  );
}

function VerifyM({ onBack, onOpen }) {
  const calls = window.AMM.verificationCalls;
  const v = window.AMM.verification;
  return (
    <MScreen>
      <MAppBar title="Verification Calls" right={onBack ? <button onClick={onBack} className="mono" style={{ background: 'none', border: 'none', color: 'var(--fg-2)', fontSize: 12 }}>Done</button> : null} />
      <div style={{ paddingTop: 16, paddingBottom: 110 }}>
        <div className="card" style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14, background: 'var(--surface-2)' }}>
          <div style={{ width: 26, height: 26, flex: 'none', borderRadius: 8, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.mic size={14} /></div>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: 'var(--fg-2)' }}>The AI calls each employee for a live verbal check before they work solo.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['Calls today', v.callsToday, 'var(--fg)'], ['Ready', v.readyRate + '%', 'var(--good)'], ['Retrain', v.notReady, 'var(--crit)']].map(([l, val, c]) => (
            <div key={l} className="card" style={{ flex: 1, padding: '11px 8px', textAlign: 'center' }}>
              <div className="mono tnum" style={{ fontSize: 19, fontWeight: 600, color: c }}>{val}</div>
              <div className="eyebrow" style={{ fontSize: 8.5, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {calls.map((c) => <VCallRowM key={c.id} c={c} onClick={() => onOpen(c)} />)}
        </div>
      </div>
    </MScreen>
  );
}

function VCallDetailM({ c, onBack }) {
  const r = MREADY[c.readiness];
  const turns = c.id === 'bianca' ? window.AMM.verificationScript.turns : null;
  return (
    <MScreen>
      <MAppBar title="Verification call" right={onBack ? <button onClick={onBack} className="mono" style={{ background: 'none', border: 'none', color: 'var(--fg-2)', fontSize: 12 }}>Done</button> : null} />
      <div style={{ paddingTop: 14, paddingBottom: 30 }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
          <Av initials={c.initials} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 560 }}>{c.emp}</div>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{c.sop} · {c.dur}</div>
          </div>
          <span className="chip" style={{ height: 24, color: r.c, borderColor: `color-mix(in oklab,${r.c} 40%,transparent)`, background: `color-mix(in oklab,${r.c} 12%,transparent)` }}><span className="dot" />{r.short}</span>
        </div>

        {/* recording player */}
        <div className="card" style={{ padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14, background: 'var(--surface-2)' }}>
          <button style={{ width: 32, height: 32, flex: 'none', borderRadius: 99, border: 'none', background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center', cursor: 'pointer' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></button>
          <div style={{ flex: 1, display: 'flex', gap: 2, alignItems: 'center', height: 26 }}>
            {Array.from({ length: 38 }).map((_, i) => <span key={i} style={{ flex: 1, minWidth: 1.5, borderRadius: 2, height: `${20 + Math.abs(Math.sin(i)) * 60}%`, background: i < 13 ? 'var(--fg)' : 'var(--border-strong)' }} />)}
          </div>
          <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{c.dur}</span>
        </div>

        {/* scores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
          {[['Knowledge', c.knowledge + '%', scoreColor(c.knowledge)], ['Confidence', c.confidence + '%', scoreColor(c.confidence)], ['Readiness', r.short, r.c]].map(([l, val, col]) => (
            <div key={l} className="card" style={{ padding: 12, textAlign: 'center' }}>
              <div className="mono tnum" style={{ fontSize: l === 'Readiness' ? 12 : 18, fontWeight: 600, color: col, marginTop: l === 'Readiness' ? 4 : 0 }}>{val}</div>
              <div className="eyebrow" style={{ fontSize: 8, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* AI assessment */}
        <div className="card" style={{ padding: 14, marginBottom: 14, background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <I.spark size={13} style={{ color: 'var(--fg-2)' }} />
            <span className="eyebrow" style={{ fontSize: 9 }}>AI assessment</span>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)', textWrap: 'pretty' }}>{c.summary}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {c.flags.map((f, i) => <span key={i} className="chip" style={{ height: 22, fontSize: 10, color: (f.includes('alert') || f.includes('Failed') || f.includes('twice')) ? 'var(--crit)' : 'var(--fg-2)' }}>{f}</span>)}
          </div>
        </div>

        {/* improvement */}
        <div className="card" style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
            <span className="eyebrow" style={{ fontSize: 9 }}>Improvement · knowledge</span>
            <Delta value={Math.abs(c.trend[c.trend.length - 1] - c.trend[0]) + ' pts'} dir={c.trend[c.trend.length - 1] >= c.trend[0] ? 'up' : 'down'} />
          </div>
          <VBars data={c.trend} labels={['4w', '3w', '2w', 'now']} h={76} color={scoreColor(c.knowledge)} />
        </div>

        {/* transcript */}
        {turns && (
          <div style={{ marginBottom: 14 }}>
            <div className="eyebrow" style={{ fontSize: 9, marginBottom: 10 }}>Transcript · AI annotations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {turns.map((t, i) => {
                if (t.who === 'ai') return (
                  <div key={i} style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--fg)' }}>
                    {t.kind && t.kind !== 'verdict' && <span className="mono" style={{ display: 'block', fontSize: 8.5, color: (t.kind === 'coach' || t.kind === 'challenge') ? 'var(--warn)' : 'var(--good)', marginBottom: 3, letterSpacing: '.04em' }}>{t.kind === 'coach' ? '◆ COACHING' : t.kind === 'challenge' ? '◆ CHALLENGING' : '◆ ADVANCING'}</span>}
                    <div style={{ padding: '8px 11px', borderRadius: '4px 12px 12px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>{t.t}</div>
                  </div>
                );
                const ql = MVQUAL[t.quality] || MVQUAL.partial;
                return (
                  <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '84%' }}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--bg)', background: 'var(--fg)', padding: '8px 11px', borderRadius: '12px 4px 12px 12px' }}>{t.t}</div>
                    <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end', marginTop: 4 }}>
                      {t.hesitation && <span className="mono" style={{ fontSize: 8.5, color: 'var(--warn)' }}>hesitation</span>}
                      <span className="mono" style={{ fontSize: 8.5, color: ql.c }}>{ql.l}</span>
                      <span className="mono tnum" style={{ fontSize: 8.5, color: 'var(--fg-3)' }}>{Math.round(t.confidence * 100)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* action */}
        {c.readiness === 'ready'
          ? <div className="chip good" style={{ height: 38, width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}><I.check size={14} sw={2.4} /> Cleared to work independently{c.follow ? ` · ${c.follow}-day follow-up` : ''}</div>
          : <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, height: 46, borderRadius: 12, border: 'none', background: 'var(--fg)', color: 'var(--bg)', fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer' }}><I.send size={15} /> Send retraining</button>
              <button style={{ width: 110, height: 46, borderRadius: 12, border: '1px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--fg)', fontSize: 13, cursor: 'pointer' }}>Re-call</button>
            </div>}
      </div>
    </MScreen>
  );
}

/* ───────── interactive manager phone ───────── */
function ManagerApp() {
  const [tab, setTab] = useState('home');
  const [esc, setEsc] = useState(null);
  const [vcall, setVcall] = useState(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  if (esc) return (
    <div style={{ position: 'absolute', inset: 0 }}><EscDetailM e={esc} onBack={() => setEsc(null)} /></div>
  );
  if (vcall) return (
    <div style={{ position: 'absolute', inset: 0 }}><VCallDetailM c={vcall} onBack={() => setVcall(null)} /></div>
  );
  if (verifyOpen) return (
    <div style={{ position: 'absolute', inset: 0 }}><VerifyM onBack={() => setVerifyOpen(false)} onOpen={(c) => { setVerifyOpen(false); setVcall(c); }} /></div>
  );
  const screens = {
    home: <HomeM setTab={setTab} openEsc={setEsc} openVerify={() => setVerifyOpen(true)} openVCall={setVcall} />,
    alerts: <AlertsM openEsc={setEsc} />,
    sites: <SitesM />,
    team: <TeamM />,
    ask: <AskM answered={false} />,
  };
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {screens[tab]}
      <MTabBar tab={tab} setTab={setTab} />
    </div>
  );
}

Object.assign(window, { ManagerApp, EscDetailM, AskM, VerifyM, VCallDetailM });
