/* AI MIDDLE MANAGER — AI Knowledge Verification Call (employee mobile) */
const { useState: useStateV, useEffect: useEffectV, useRef: useRefV } = React;

const READY = {
  ready:       { c: 'var(--good)', label: 'Ready to work independently', short: 'Ready', icon: 'shield' },
  borderline:  { c: 'var(--warn)', label: 'Borderline — re-check needed', short: 'Borderline', icon: 'replay' },
  'not-ready': { c: 'var(--crit)', label: 'Not ready — retraining required', short: 'Not ready', icon: 'alert' },
};
const QUALITY = { strong: { c: 'var(--good)', l: 'Strong' }, partial: { c: 'var(--warn)', l: 'Partial' }, weak: { c: 'var(--crit)', l: 'Weak' } };
const MODE_FOR = { challenge: 'Probing', coach: 'Coaching', advance: 'Advanced', verdict: 'Wrapping up' };

function ConfMeter({ v, w = 90 }) {
  const c = v >= 70 ? 'var(--good)' : v >= 45 ? 'var(--warn)' : 'var(--crit)';
  return (
    <div style={{ width: w, height: 5, borderRadius: 99, background: 'var(--active)', overflow: 'hidden' }}>
      <div style={{ width: `${v}%`, height: '100%', background: c, borderRadius: 99, transition: 'width .5s var(--ease)' }} />
    </div>
  );
}

function VBubble({ turn }) {
  const ai = turn.who === 'ai';
  if (ai) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
        {turn.tag && <span className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', padding: '0 2px', letterSpacing: '.04em' }}>{turn.tag.toUpperCase()}</span>}
        <div style={{ maxWidth: '88%', fontSize: 13.5, lineHeight: 1.5, padding: '10px 13px', borderRadius: '4px 14px 14px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--fg)' }}>
          {turn.kind && turn.kind !== 'verdict' && (
            <span className="mono" style={{ display: 'block', fontSize: 9, color: turn.kind === 'coach' || turn.kind === 'challenge' ? 'var(--warn)' : 'var(--good)', marginBottom: 5, letterSpacing: '.04em' }}>
              {turn.kind === 'coach' ? '◆ COACHING' : turn.kind === 'challenge' ? '◆ CHALLENGING' : '◆ ADVANCING'}
            </span>
          )}
          {turn.t}
        </div>
      </div>
    );
  }
  const ql = QUALITY[turn.quality] || QUALITY.partial;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
      <div style={{ maxWidth: '82%', fontSize: 13.5, lineHeight: 1.45, padding: '10px 13px', borderRadius: '14px 4px 14px 14px', background: 'var(--fg)', color: 'var(--bg)' }}>{turn.t}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 2px' }}>
        {turn.hesitation && <span className="mono" style={{ fontSize: 9, color: 'var(--warn)' }}>hesitation</span>}
        <span className="mono" style={{ fontSize: 9, color: ql.c }}>{ql.l.toLowerCase()} answer</span>
        <ConfMeter v={Math.round(turn.confidence * 100)} w={44} />
      </div>
    </div>
  );
}

function VerificationCall({ onClose, startIdx, frozen, showVerdict }) {
  const S = window.AMM.verificationScript;
  const total = S.turns.length;
  const [revealed, setRevealed] = useStateV(frozen ? (startIdx || total) : 1);
  const [done, setDone] = useStateV(!!showVerdict);
  const [secs, setSecs] = useStateV(frozen ? 132 : 0);
  const scrollRef = useRefV(null);

  // playback
  useEffectV(() => {
    if (frozen || done) return;
    if (revealed >= total) { const t = setTimeout(() => setDone(true), 1400); return () => clearTimeout(t); }
    const cur = S.turns[revealed - 1];
    const delay = cur && cur.who === 'ai' ? 2600 : 1900;
    const t = setTimeout(() => setRevealed((r) => r + 1), delay);
    return () => clearTimeout(t);
  }, [revealed, done, frozen]);

  useEffectV(() => {
    if (frozen) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [frozen]);

  useEffectV(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [revealed]);

  const shown = S.turns.slice(0, revealed);
  const empShown = shown.filter((t) => t.who === 'emp');
  const conf = empShown.length ? Math.round(empShown.reduce((a, t) => a + t.confidence, 0) / empShown.length * 100) : 0;
  const lastEmp = empShown[empShown.length - 1];
  const lastAi = [...shown].reverse().find((t) => t.who === 'ai');
  const mode = lastAi && lastAi.kind ? (MODE_FOR[lastAi.kind] || 'Standard') : 'Standard';
  const speaking = shown.length ? shown[shown.length - 1].who : 'ai';
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0');

  // VERDICT
  if (done) {
    const v = S.verdict; const r = READY[v.readiness]; const RI = I[r.icon];
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', color: 'var(--fg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: .4, maskImage: 'radial-gradient(80% 50% at 50% 16%, black, transparent)' }} />
        <div style={{ position: 'relative', flex: 1, overflowY: 'auto', padding: '60px 22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div className="eyebrow" style={{ fontSize: 10 }}>Knowledge verification complete</div>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 6 }}>{S.sop} · {mm}:{ss}</div>
          </div>
          <div style={{ width: 64, height: 64, borderRadius: 99, margin: '0 auto 16px', background: `color-mix(in oklab, ${r.c} 16%, transparent)`, color: r.c, display: 'grid', placeContent: 'center' }}><RI size={32} /></div>
          <div style={{ textAlign: 'center', fontSize: 21, fontWeight: 600, color: r.c, letterSpacing: '-.01em', textWrap: 'balance' }}>{r.label}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '22px 0' }}>
            {[['Knowledge', v.knowledge], ['Confidence', v.confidence]].map(([l, val]) => (
              <div key={l} className="card" style={{ padding: 15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span className="eyebrow" style={{ fontSize: 9 }}>{l}</span>
                  <span className="mono tnum" style={{ fontSize: 19, fontWeight: 600, color: scoreColor(val) }}>{val}</span>
                </div>
                <div className="meter" style={{ marginTop: 9 }}><i style={{ width: `${val}%`, background: scoreColor(val) }} /></div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 15, marginBottom: 14, background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <I.spark size={15} style={{ color: 'var(--fg-2)', flex: 'none', marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)', textWrap: 'pretty' }}>{v.note}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--fg-3)', marginBottom: 20, paddingLeft: 2 }}>
            <I.check size={13} sw={2.4} style={{ color: 'var(--good)' }} /> Result sent to your manager
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', background: 'var(--fg)', color: 'var(--bg)', fontSize: 14.5, fontWeight: 600, cursor: 'pointer' }}>Done</button>
        </div>
      </div>
    );
  }

  // LIVE CALL
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', color: 'var(--fg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      onClick={() => { if (!frozen && revealed < total) setRevealed((r) => r + 1); }}>
      {/* header */}
      <div style={{ height: 54, flex: 'none', display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <button onClick={(e) => { e.stopPropagation(); onClose && onClose(); }} style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: 'transparent', color: 'var(--fg-2)', display: 'grid', placeContent: 'center', cursor: 'pointer' }}><I.close size={18} /></button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>AI Operations Manager</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--good)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--good)' }} /> Knowledge check · {mm}:{ss}
          </div>
        </div>
        <span style={{ width: 34 }} />
      </div>

      {/* live analysis strip */}
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <div style={{ flex: 1 }}>
          <div className="mono" style={{ fontSize: 8.5, color: 'var(--fg-4)', letterSpacing: '.06em', marginBottom: 4 }}>CONFIDENCE</div>
          <ConfMeter v={conf} w={'100%'} />
        </div>
        <div style={{ width: 1, height: 26, background: 'var(--border)' }} />
        <div style={{ textAlign: 'center', minWidth: 52 }}>
          <div className="mono" style={{ fontSize: 8.5, color: 'var(--fg-4)', letterSpacing: '.06em', marginBottom: 3 }}>ANSWER</div>
          <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: lastEmp ? (QUALITY[lastEmp.quality] || QUALITY.partial).c : 'var(--fg-3)' }}>{lastEmp ? (QUALITY[lastEmp.quality] || QUALITY.partial).l : '—'}</span>
        </div>
        <div style={{ width: 1, height: 26, background: 'var(--border)' }} />
        <div style={{ textAlign: 'center', minWidth: 56 }}>
          <div className="mono" style={{ fontSize: 8.5, color: 'var(--fg-4)', letterSpacing: '.06em', marginBottom: 3 }}>AI MODE</div>
          <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: mode === 'Coaching' || mode === 'Probing' ? 'var(--warn)' : mode === 'Advanced' ? 'var(--good)' : 'var(--fg-2)' }}>{mode}</span>
        </div>
      </div>

      {/* orb + waveform */}
      <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0 10px', position: 'relative' }}>
        <div className={speaking === 'ai' ? 'amm-orb' : ''} style={{ width: 76, height: 76, borderRadius: 99, background: 'radial-gradient(circle at 38% 32%, var(--fg), color-mix(in oklab, var(--fg) 50%, var(--bg)))', boxShadow: speaking === 'ai' ? '0 0 50px -8px color-mix(in oklab, var(--fg) 40%, transparent)' : 'none', opacity: speaking === 'ai' ? 1 : .55, transition: 'opacity .3s' }} />
        <div style={{ display: 'flex', gap: 2.5, alignItems: 'center', height: 20, marginTop: 10 }}>
          {Array.from({ length: 19 }).map((_, i) => (
            <span key={i} className={speaking === 'ai' ? 'amm-bar' : ''} style={{ width: 2.5, borderRadius: 2, background: speaking === 'ai' ? 'var(--fg-2)' : 'var(--border-strong)', animationDelay: `${i * 0.06}s`, height: `${8 + Math.abs(Math.sin(i)) * 14}px` }} />
          ))}
        </div>
      </div>

      {/* transcript */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {shown.map((t, i) => <VBubble key={i} turn={t} />)}
      </div>

      {/* mic bar */}
      <div style={{ flex: 'none', padding: '12px 16px 26px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={(e) => e.stopPropagation()} style={{ width: 46, height: 46, flex: 'none', borderRadius: 99, border: 'none', background: speaking === 'emp' ? 'var(--fg)' : 'var(--surface-2)', color: speaking === 'emp' ? 'var(--bg)' : 'var(--fg-3)', display: 'grid', placeContent: 'center', cursor: 'pointer', boxShadow: speaking === 'emp' ? '0 6px 20px -6px color-mix(in oklab, var(--fg) 45%, transparent)' : 'none' }}><I.mic size={20} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500 }}>{speaking === 'ai' ? 'AI Manager speaking…' : `Listening to ${S.emp.split(' ')[0]}…`}</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{frozen ? 'tap mic to answer' : 'tap anywhere to continue'}</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose && onClose(); }} style={{ width: 46, height: 46, flex: 'none', borderRadius: 99, border: 'none', background: 'var(--crit)', color: '#fff', display: 'grid', placeContent: 'center', cursor: 'pointer' }}><I.phone size={20} style={{ transform: 'rotate(135deg)' }} /></button>
      </div>
    </div>
  );
}

Object.assign(window, { VerificationCall });
