/* AI MIDDLE MANAGER — Mobile employee app (Bianca Reyes) */
const { useState, useEffect, useRef } = React;

const PHONE_W = 390, PHONE_H = 844;
const ME = window.AMM.employees.find((e) => e.id === 'bianca');

/* ---- inner app shell: dark canvas inside the bezel ---- */
function Screen({ children, pad = true, style }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', color: 'var(--fg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style }}>
      <div style={{ height: 54, flex: 'none' }} />
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: pad ? '0 18px' : 0, WebkitOverflowScrolling: 'touch' }}>{children}</div>
    </div>
  );
}

function TabBar({ tab, setTab }) {
  const tabs = [
    { id: 'home', icon: 'grid', label: 'Today' },
    { id: 'tasks', icon: 'checklist', label: 'Tasks' },
    { id: 'call', icon: 'phone', label: '', big: true },
    { id: 'train', icon: 'video', label: 'Train' },
    { id: 'me', icon: 'users', label: 'Me' },
  ];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 86, paddingBottom: 22, zIndex: 30,
      background: 'linear-gradient(to top, var(--bg) 60%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 12px 22px' }}>
      {tabs.map((t) => {
        const Ico = I[t.icon];
        const active = tab === t.id;
        if (t.big) return (
          <button key={t.id} onClick={() => setTab('call')} style={{ width: 56, height: 56, borderRadius: 99, border: 'none', background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px -6px rgba(0,0,0,.6)', marginTop: -18 }}>
            <Ico size={23} />
          </button>
        );
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 10px', color: active ? 'var(--fg)' : 'var(--fg-4)', flex: 1 }}>
            <Ico size={21} />
            <span className="mono" style={{ fontSize: 9, letterSpacing: '.02em' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AppBar({ title, accent }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 54, paddingTop: 4, zIndex: 25, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'color-mix(in oklab, var(--bg) 82%, transparent)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.01em' }}>{title}</span>
    </div>
  );
}

/* ───────── HOME / TODAY ───────── */
function HomeScreen({ setTab }) {
  const todays = window.AMM.tasks.filter((t) => t.assignee === ME.name);
  const done = todays.filter((t) => t.status === 'done').length;
  return (
    <Screen>
      <AppBar title="Today" />
      <div style={{ paddingTop: 18, paddingBottom: 110 }}>
        {/* greeting */}
        <div style={{ marginBottom: 18 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>Tue 3 Jun · 06:00–14:00</div>
          <h2 style={{ fontSize: 26, marginTop: 6, letterSpacing: '-.02em' }}>Morning, Bianca.</h2>
        </div>

        {/* AI briefing card */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.spark size={13} /></div>
            <span className="eyebrow" style={{ fontSize: 10 }}>From your AI Manager</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--fg-2)', textWrap: 'pretty' }}>
            You've got <b style={{ color: 'var(--fg)' }}>{todays.length} tasks</b> today. Room 14 needs a re-centre on the blanket — quick fix. Pool chemical log is due by 17:00.
          </p>
        </div>

        {/* call AI big button */}
        <button onClick={() => setTab('call')} style={{ width: '100%', padding: '15px 18px', borderRadius: 14, border: '1px solid var(--border-2)', background: 'var(--fg)', color: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer', marginBottom: 22 }}>
          <div style={{ width: 38, height: 38, borderRadius: 99, background: 'color-mix(in oklab, var(--bg) 14%, transparent)', display: 'grid', placeContent: 'center', flex: 'none' }}><I.phone size={18} /></div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>Call the AI Manager</div>
            <div style={{ fontSize: 11.5, opacity: .7 }}>Ask anything · always available</div>
          </div>
          <I.arrow size={18} />
        </button>

        {/* progress */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="eyebrow" style={{ fontSize: 10 }}>Your tasks · {done}/{todays.length} done</span>
          <button onClick={() => setTab('tasks')} className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', background: 'none', border: 'none' }}>All</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {todays.slice(0, 3).map((t) => <MiniTask key={t.id} t={t} />)}
        </div>

        {/* quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
          <div className="card" style={{ padding: 14 }}>
            <div className="mono tnum" style={{ fontSize: 24, fontWeight: 600, color: 'var(--good)' }}>{ME.score}</div>
            <div className="eyebrow" style={{ fontSize: 9, marginTop: 3 }}>AI Score</div>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div className="mono tnum" style={{ fontSize: 24, fontWeight: 600 }}>{ME.tasksWk}</div>
            <div className="eyebrow" style={{ fontSize: 9, marginTop: 3 }}>Tasks this wk</div>
          </div>
        </div>
      </div>
    </Screen>
  );
}

function MiniTask({ t, onTap }) {
  const c = t.status === 'done' ? 'var(--good)' : t.status === 'overdue' ? 'var(--crit)' : t.priority === 'high' ? 'var(--warn)' : 'var(--fg-3)';
  return (
    <button onClick={onTap} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%', cursor: 'pointer', background: 'var(--surface)' }}>
      <span style={{ width: 20, height: 20, borderRadius: 6, flex: 'none', border: `1.5px solid ${t.status === 'done' ? 'var(--good)' : 'var(--border-strong)'}`, background: t.status === 'done' ? 'var(--good)' : 'transparent', display: 'grid', placeContent: 'center', color: 'var(--bg)' }}>
        {t.status === 'done' && <I.check size={12} sw={3} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, textDecoration: t.status === 'done' ? 'line-through' : 'none', opacity: t.status === 'done' ? .5 : 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 2 }}>{t.due} · {t.loc.split(' ').slice(0,2).join(' ')}</div>
      </div>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: c, flex: 'none' }} />
    </button>
  );
}

/* ───────── TASKS ───────── */
function TasksScreen() {
  const mine = window.AMM.tasks.filter((t) => t.assignee === ME.name);
  const extra = [
    { id:'M1', title:'Restock minibar — Rooms 12–14', status:'todo', priority:'low', due:'Today 15:30', loc:'Balan Village' },
    { id:'M2', title:'Photo-verify Room 14 re-clean', status:'todo', priority:'high', due:'Today 13:30', loc:'Balan Village' },
  ];
  const all = [...mine, ...extra];
  return (
    <Screen>
      <AppBar title="Tasks" />
      <div style={{ paddingTop: 16, paddingBottom: 110 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['All', all.length], ['To do', all.filter(t=>t.status!=='done').length], ['Done', all.filter(t=>t.status==='done').length]].map(([l, n], i) => (
            <div key={l} className="card" style={{ flex: 1, padding: '10px 12px', textAlign: 'center', background: i === 0 ? 'var(--surface-2)' : 'var(--surface)' }}>
              <div className="mono tnum" style={{ fontSize: 19, fontWeight: 600 }}>{n}</div>
              <div className="eyebrow" style={{ fontSize: 8.5, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {all.map((t) => <MiniTask key={t.id} t={t} />)}
        </div>
      </div>
    </Screen>
  );
}

/* ───────── TRAINING ───────── */
function TrainScreen({ onQuiz, onVerify }) {
  const mods = [
    { id:'SOP-021', title:'Bathroom Deep Clean', dur:'4:12', done:true, tag:'Updated', type:'video', quiz:'4/5' },
    { id:'SOP-001', title:'Standard Room Turnover', dur:'6:40', done:true, type:'video', quiz:'5/5' },
    { id:'SOP-014', title:'Carpet & Upholstery Care', dur:'3:05', done:false, type:'video' },
    { id:'SOP-052', title:'Fire & Safety Inspection', dur:'8:20', done:false, type:'doc' },
  ];
  return (
    <Screen>
      <AppBar title="Training" />
      <div style={{ paddingTop: 18, paddingBottom: 110 }}>
        {/* featured */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 18 }}>
          <div className="ph" style={{ height: 150, borderRadius: 0, border: 'none' }}>
            <span>training video</span>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: 99, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center', boxShadow: '0 8px 24px -6px rgba(0,0,0,.6)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
            <span className="chip good" style={{ position: 'absolute', top: 12, left: 12, height: 22 }}>New SOP</span>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Bathroom Deep Clean v2</div>
            <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--fg-3)', lineHeight: 1.5 }}>Your AI Manager queued this — 4 min. Cuts inspection failures by 37%.</p>
            {/* AI quiz + call gate */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 30, height: 30, flex: 'none', borderRadius: 8, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.spark size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 540 }}>Competency check required</div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>Quiz, then a live AI call to work solo</div>
              </div>
              <button onClick={onQuiz} style={{ height: 36, padding: '0 15px', borderRadius: 9, border: 'none', background: 'var(--fg)', color: 'var(--bg)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', flex: 'none' }}>Start</button>
            </div>
            {/* two-step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <span className="chip" style={{ height: 24, flex: 'none' }}><I.checklist size={12} /> 1 · Quiz</span>
              <span style={{ flex: 'none', color: 'var(--fg-4)' }}><I.arrow size={13} /></span>
              <button onClick={onVerify} className="chip" style={{ height: 24, flex: 'none', cursor: 'pointer', border: '1px solid var(--border-2)', background: 'var(--surface)' }}><I.phone size={12} /> 2 · AI call</button>
            </div>
          </div>
        </div>
        <span className="eyebrow" style={{ fontSize: 10 }}>All modules</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {mods.map((m) => {
            const Ico = I[m.type === 'video' ? 'video' : 'doc'];
            return (
              <div key={m.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'grid', placeContent: 'center', flex: 'none' }}><Ico size={16} style={{ color: 'var(--fg-3)' }} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>{m.dur} · {m.id}</div>
                </div>
                {m.done
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
                      {m.quiz && <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', display: 'flex', alignItems: 'center', gap: 3 }}><I.award size={12} style={{ color: scoreColor(m.quiz === '5/5' ? 100 : 80) }} />{m.quiz}</span>}
                      <span className="chip good" style={{ height: 20 }}><I.check size={11} sw={2.5} /></span>
                    </span>
                  : <span className="chip" style={{ height: 20 }}>Start</span>}
              </div>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}

/* ───────── ME / PROFILE ───────── */
function MeScreen() {
  const metrics = [['Quality', ME.quality], ['SOP adherence', ME.sop], ['Reliability', ME.reliability], ['Training', ME.training]];
  return (
    <Screen>
      <AppBar title="You" />
      <div style={{ paddingTop: 22, paddingBottom: 110, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Av initials={ME.initials} size={68} online />
        <h2 style={{ fontSize: 20, marginTop: 12 }}>{ME.name}</h2>
        <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 3 }}>{ME.role} · {ME.loc}</div>
        <div style={{ position: 'relative', margin: '22px 0 6px' }}><Ring value={ME.score} size={150} /></div>
        <div className="eyebrow" style={{ fontSize: 10 }}>AI Performance Score</div>
        <div className="card" style={{ padding: 18, marginTop: 22, width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {metrics.map(([l, v]) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: 'var(--fg-2)' }}>{l}</span>
                <span className="mono tnum" style={{ color: scoreColor(v), fontWeight: 600 }}>{v}</span>
              </div>
              <div className="meter"><i style={{ width: `${v}%`, background: scoreColor(v) }} /></div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

/* ───────── AI VOICE CALL (hero) ───────── */
function CallScreen({ setTab }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => { const t = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(t); }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0');
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', color: 'var(--fg)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: .4, maskImage: 'radial-gradient(80% 60% at 50% 20%, black, transparent)' }} />
      <div style={{ position: 'relative', paddingTop: 78, textAlign: 'center' }}>
        <div className="eyebrow" style={{ fontSize: 10 }}>On call with</div>
        <div style={{ fontSize: 19, fontWeight: 600, marginTop: 6 }}>AI Operations Manager</div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--good)', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--good)' }} /> {mm}:{ss}
        </div>
      </div>

      {/* orb */}
      <div style={{ position: 'relative', marginTop: 40, marginBottom: 12 }}>
        <div className="amm-orb" style={{ width: 168, height: 168, borderRadius: 99, background: 'radial-gradient(circle at 38% 32%, var(--fg), color-mix(in oklab, var(--fg) 50%, var(--bg)))', boxShadow: '0 0 80px -10px color-mix(in oklab, var(--fg) 40%, transparent)' }} />
      </div>

      {/* waveform */}
      <div style={{ position: 'relative', display: 'flex', gap: 3, alignItems: 'center', height: 40, marginTop: 14 }}>
        {Array.from({ length: 27 }).map((_, i) => (
          <span key={i} className="amm-bar" style={{ width: 3, borderRadius: 2, background: 'var(--fg-2)', animationDelay: `${i * 0.06}s`, height: `${14 + (Math.abs(Math.sin(i)) * 26)}px` }} />
        ))}
      </div>

      {/* live transcript */}
      <div style={{ position: 'relative', margin: '26px 24px 0', padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, maxWidth: 320 }}>
        <div className="eyebrow" style={{ fontSize: 9, marginBottom: 7 }}>Live transcript</div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>
          "The blanket in Room 14 is offset left. Re-centre it, snap a photo, and I'll re-verify in a few seconds."
        </p>
      </div>

      {/* controls */}
      <div style={{ position: 'absolute', bottom: 54, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 24, alignItems: 'center' }}>
        <button style={{ width: 56, height: 56, borderRadius: 99, border: '1px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--fg-2)', display: 'grid', placeContent: 'center', cursor: 'pointer' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>
        <button onClick={() => setTab('home')} style={{ width: 66, height: 66, borderRadius: 99, border: 'none', background: 'var(--crit)', color: '#fff', display: 'grid', placeContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px -6px color-mix(in oklab,var(--crit) 60%,transparent)' }}><I.phone size={24} style={{ transform: 'rotate(135deg)' }} /></button>
        <button style={{ width: 56, height: 56, borderRadius: 99, border: '1px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--fg-2)', display: 'grid', placeContent: 'center', cursor: 'pointer' }}><I.camera size={20} /></button>
      </div>
    </div>
  );
}

/* ───────── PHOTO QUALITY RESULT (hero, static state phone) ───────── */
function PhotoScreen() {
  const qi = window.AMM.inspection;
  const passed = qi.checks.filter((c) => c.pass).length;
  return (
    <Screen>
      <AppBar title="Quality check" />
      <div style={{ paddingTop: 14, paddingBottom: 28 }}>
        {/* viewfinder */}
        <div className="ph" style={{ aspectRatio: '3/4', borderRadius: 16, marginBottom: 14, position: 'relative' }}>
          <span>room 14 — your photo</span>
          {/* corner guides */}
          {[['8px','8px','','',''],['8px','','8px','',''],['','8px','','8px',''],['','','8px','8px','']].map((c,i)=>(
            <span key={i} style={{ position:'absolute', top:c[0]||'auto', left:c[1]||'auto', right:c[3]||'auto', bottom:c[2]||'auto', width:22, height:22, borderTop:c[0]?'2px solid var(--fg-2)':'none', borderLeft:c[1]?'2px solid var(--fg-2)':'none', borderBottom:c[2]?'2px solid var(--fg-2)':'none', borderRight:c[3]?'2px solid var(--fg-2)':'none', borderRadius:3 }} />
          ))}
          <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 8, background: 'color-mix(in oklab, var(--bg) 80%, transparent)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '8px 11px' }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center', flex: 'none' }}><I.spark size={11} /></div>
            <span style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>AI analysed in 1.4s · {qi.confidence}% confidence</span>
          </div>
        </div>

        {/* verdict */}
        <div className="card" style={{ padding: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, borderColor: 'color-mix(in oklab, var(--warn) 35%, transparent)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--warn-soft)', color: 'var(--warn)', display: 'grid', placeContent: 'center', flex: 'none' }}><I.alert size={20} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--warn)' }}>Needs revision</div>
            <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{passed}/{qi.checks.length} checks passed</div>
          </div>
        </div>

        {/* checklist */}
        <div className="card" style={{ padding: '6px 14px', marginBottom: 14 }}>
          {qi.checks.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: i < qi.checks.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ width: 18, height: 18, flex: 'none', borderRadius: 5, display: 'grid', placeContent: 'center', background: c.pass ? 'var(--good-soft)' : 'var(--crit-soft)', color: c.pass ? 'var(--good)' : 'var(--crit)' }}>
                {c.pass ? <I.check size={11} sw={2.6} /> : <I.close size={10} sw={2.6} />}
              </span>
              <span style={{ fontSize: 12.5, flex: 1, color: c.pass ? 'var(--fg-2)' : 'var(--fg)' }}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* AI note */}
        <div className="card" style={{ padding: 14, marginBottom: 16, display: 'flex', gap: 10, background: 'var(--surface-2)' }}>
          <I.spark size={15} style={{ color: 'var(--fg-2)', flex: 'none', marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--fg-2)' }}>{qi.aiNote}</p>
        </div>

        <button style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', background: 'var(--fg)', color: 'var(--bg)', fontSize: 14.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
          <I.camera size={18} /> Re-take & re-submit
        </button>
      </div>
    </Screen>
  );
}

/* ───────── interactive phone (tab router) ───────── */
function EmployeeApp() {
  const [tab, setTab] = useState('home');
  const [quiz, setQuiz] = useState(false);
  const [verify, setVerify] = useState(false);
  const screens = { home: <HomeScreen setTab={setTab} />, tasks: <TasksScreen />, train: <TrainScreen onQuiz={() => setQuiz(true)} onVerify={() => setVerify(true)} />, me: <MeScreen />, call: <CallScreen setTab={setTab} /> };
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {screens[tab]}
      {tab !== 'call' && !quiz && !verify && <TabBar tab={tab} setTab={setTab} />}
      {quiz && <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}><QuizFlow onClose={() => setQuiz(false)} onVerify={() => { setQuiz(false); setVerify(true); }} /></div>}
      {verify && <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}><VerificationCall onClose={() => setVerify(false)} /></div>}
    </div>
  );
}

Object.assign(window, { EmployeeApp, CallScreen, PhotoScreen, PHONE_W, PHONE_H });
