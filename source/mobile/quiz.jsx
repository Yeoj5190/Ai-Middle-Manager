/* AI MIDDLE MANAGER — AI Training Quiz (employee mobile) */
const { useState: useStateQ, useEffect: useEffectQ, useRef: useRefQ } = React;

const PASS_PCT = 80;

/* shared quiz chrome (dark/light via tokens) */
function QChrome({ title, onClose, right, children }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', color: 'var(--fg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ height: 54, flex: 'none', position: 'relative', zIndex: 20, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', marginTop: 0 }}>
        {onClose
          ? <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: 'transparent', color: 'var(--fg-2)', display: 'grid', placeContent: 'center', cursor: 'pointer' }}><I.close size={18} /></button>
          : <span style={{ width: 34 }} />}
        <span style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{title}</span>
        <span style={{ width: 34, display: 'grid', placeItems: 'center' }}>{right}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>{children}</div>
    </div>
  );
}

function AiBubble({ children, small }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 26, height: 26, flex: 'none', borderRadius: 8, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.spark size={14} /></div>
      <div style={{ flex: 1, fontSize: small ? 13 : 14, lineHeight: 1.5, padding: '11px 14px', borderRadius: '4px 14px 14px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--fg)', textWrap: 'pretty' }}>{children}</div>
    </div>
  );
}

function ProgressDots({ n, current, results }) {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '12px 18px 4px' }}>
      {Array.from({ length: n }).map((_, i) => {
        let bg = 'var(--border-strong)';
        if (results[i] === true) bg = 'var(--good)';
        else if (results[i] === false) bg = 'var(--crit)';
        else if (i === current) bg = 'var(--fg)';
        return <span key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: bg, transition: 'background .3s' }} />;
      })}
    </div>
  );
}

/* one multiple-choice / text question */
function Question({ q, locked, response, onAnswer, mode }) {
  const [text, setText] = useStateQ('');
  const correct = response && response.correct;

  function checkText() {
    const v = text.trim().toLowerCase();
    if (!v) return;
    const ok = q.accept.some((a) => v.includes(a));
    onAnswer({ val: text, correct: ok });
  }
  function fillVoice() {
    // simulate a spoken answer being transcribed
    setText(q.sample);
    const ok = q.accept.some((a) => q.sample.toLowerCase().includes(a));
    setTimeout(() => onAnswer({ val: q.sample, correct: ok }), 500);
  }

  return (
    <div style={{ padding: '8px 18px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 14px' }}>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>Q{q.id} · {q.topic}</span>
      </div>
      <h2 style={{ fontSize: 19, lineHeight: 1.35, letterSpacing: '-.01em', marginBottom: 20, textWrap: 'pretty' }}>{q.q}</h2>

      {/* CHOICE */}
      {q.type === 'choice' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt, i) => {
            const chosen = response && response.val === i;
            const isAns = i === q.answer;
            let bd = 'var(--border-2)', bgc = 'var(--surface)', fg = 'var(--fg)', icon = null;
            if (locked) {
              if (isAns) { bd = 'var(--good)'; bgc = 'var(--good-soft)'; fg = 'var(--good)'; icon = <I.check size={15} sw={2.6} />; }
              else if (chosen) { bd = 'var(--crit)'; bgc = 'var(--crit-soft)'; fg = 'var(--crit)'; icon = <I.close size={14} sw={2.6} />; }
              else { fg = 'var(--fg-3)'; }
            }
            return (
              <button key={i} disabled={locked} onClick={() => onAnswer({ val: i, correct: isAns })}
                style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '14px 15px', borderRadius: 12, border: `1.5px solid ${bd}`, background: bgc, color: fg, font: 'inherit', fontSize: 14, fontWeight: 500, cursor: locked ? 'default' : 'pointer', transition: 'all .15s' }}>
                <span style={{ width: 22, height: 22, flex: 'none', borderRadius: 7, border: `1.5px solid ${locked && (isAns || chosen) ? 'transparent' : 'var(--border-strong)'}`, background: locked && isAns ? 'var(--good)' : locked && chosen ? 'var(--crit)' : 'transparent', color: 'var(--bg)', display: 'grid', placeContent: 'center', fontSize: 11 }}>
                  {locked && (isAns || chosen) ? icon : <span className="mono" style={{ color: 'var(--fg-3)' }}>{String.fromCharCode(65 + i)}</span>}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* TEXT */}
      {q.type === 'text' && (
        <div>
          {mode === 'voice' && !locked ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '14px 0' }}>
              <button onClick={fillVoice} className="amm-orb" style={{ width: 78, height: 78, borderRadius: 99, border: 'none', background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center', cursor: 'pointer', boxShadow: '0 8px 30px -8px color-mix(in oklab, var(--fg) 45%, transparent)' }}><I.mic size={28} /></button>
              <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>Tap and say your answer</span>
            </div>
          ) : (
            <div>
              <textarea value={locked ? (response ? response.val : '') : text} disabled={locked} onChange={(e) => setText(e.target.value)} placeholder="Type your answer…" rows={3}
                style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 12, border: `1.5px solid ${locked ? (correct ? 'var(--good)' : 'var(--crit)') : 'var(--border-2)'}`, background: 'var(--surface)', color: 'var(--fg)', font: 'inherit', fontSize: 14, resize: 'none', outline: 'none' }} />
              {!locked && (
                <button onClick={checkText} disabled={!text.trim()} style={{ width: '100%', marginTop: 10, height: 46, borderRadius: 12, border: 'none', background: text.trim() ? 'var(--fg)' : 'var(--surface-2)', color: text.trim() ? 'var(--bg)' : 'var(--fg-4)', fontSize: 14, fontWeight: 600, cursor: text.trim() ? 'pointer' : 'default' }}>Check answer</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* FEEDBACK */}
      {locked && (
        <div className="fade-up" style={{ marginTop: 18, padding: 15, borderRadius: 12, background: correct ? 'var(--good-soft)' : 'var(--warn-soft)', border: `1px solid color-mix(in oklab, ${correct ? 'var(--good)' : 'var(--warn)'} 32%, transparent)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, flex: 'none', background: correct ? 'var(--good)' : 'var(--warn)', color: '#fff', display: 'grid', placeContent: 'center' }}>{correct ? <I.check size={13} sw={2.8} /> : <I.close size={12} sw={2.8} />}</span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: correct ? 'var(--good)' : 'var(--warn)' }}>{correct ? 'Correct' : 'Not quite'}</span>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--fg-3)', display: 'flex', alignItems: 'center', gap: 4 }}><I.spark size={11} /> AI</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--fg-2)', textWrap: 'pretty' }}>{correct ? q.explain : q.explainWrong}</p>
        </div>
      )}
    </div>
  );
}

/* results screen */
function QuizResult({ quiz, responses, onClose, onRetake, onVerify }) {
  const total = quiz.questions.length;
  const score = quiz.questions.filter((q) => responses[q.id] && responses[q.id].correct).length;
  const pct = Math.round((score / total) * 100);
  const passed = pct >= PASS_PCT;
  const missed = quiz.questions.filter((q) => responses[q.id] && !responses[q.id].correct);
  const accent = passed ? 'var(--good)' : 'var(--warn)';
  return (
    <div style={{ padding: '20px 18px 30px' }}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ width: 56, height: 56, borderRadius: 99, margin: '0 auto 14px', background: passed ? 'var(--good-soft)' : 'var(--warn-soft)', color: accent, display: 'grid', placeContent: 'center' }}>
          {passed ? <I.award size={28} /> : <I.replay size={26} />}
        </div>
        <div style={{ position: 'relative', display: 'inline-block' }}><Ring value={pct} size={132} color={accent} /></div>
        <div style={{ fontSize: 22, fontWeight: 600, color: accent, marginTop: 14, letterSpacing: '-.01em' }}>{passed ? 'Passed' : 'Needs review'}</div>
        <div className="mono" style={{ fontSize: 12.5, color: 'var(--fg-3)', marginTop: 4 }}>{score} of {total} correct · {quiz.sop}</div>
      </div>

      {/* per-question recap */}
      <span className="eyebrow" style={{ fontSize: 10 }}>Question recap</span>
      <div className="card" style={{ padding: '4px 14px', marginTop: 11, marginBottom: 16 }}>
        {quiz.questions.map((q, i) => {
          const ok = responses[q.id] && responses[q.id].correct;
          return (
            <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderBottom: i < total - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ width: 20, height: 20, flex: 'none', borderRadius: 6, display: 'grid', placeContent: 'center', background: ok ? 'var(--good-soft)' : 'var(--crit-soft)', color: ok ? 'var(--good)' : 'var(--crit)' }}>{ok ? <I.check size={12} sw={2.6} /> : <I.close size={11} sw={2.6} />}</span>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--fg-2)' }}>{q.topic}</span>
              <span className="mono" style={{ fontSize: 10.5, color: ok ? 'var(--good)' : 'var(--crit)' }}>{ok ? 'Correct' : 'Missed'}</span>
            </div>
          );
        })}
      </div>

      {/* AI recommendation */}
      <div className="card" style={{ padding: 15, marginBottom: 18, background: 'var(--surface-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <I.spark size={14} style={{ color: 'var(--fg-2)' }} />
          <span className="eyebrow" style={{ fontSize: 9.5 }}>AI recommendation</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--fg-2)', textWrap: 'pretty' }}>
          {passed
            ? (missed.length
                ? `Great work — you passed. You missed "${missed[0].topic}", so I've saved a 30-second clip on that step to your training tab.`
                : 'Perfect score — you clearly understand the process. You\u2019re cleared to start the task.')
            : `You\u2019re close, but a few key steps need review. I\u2019ll replay the section on "${missed[0] ? missed[0].topic : 'the missed steps'}" and re-quiz you before you take this task on.`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {passed
          ? <button onClick={onVerify || onClose} style={{ flex: 1, height: 48, borderRadius: 12, border: 'none', background: 'var(--fg)', color: 'var(--bg)', fontSize: 14.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}><I.phone size={17} /> Continue to AI call</button>
          : <>
              <button onClick={onRetake} style={{ flex: 1, height: 48, borderRadius: 12, border: 'none', background: 'var(--fg)', color: 'var(--bg)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer' }}><I.video size={17} /> Rewatch & retry</button>
              <button onClick={onClose} style={{ width: 96, height: 48, borderRadius: 12, border: '1px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--fg)', fontSize: 14, cursor: 'pointer' }}>Later</button>
            </>}
      </div>
      {passed && (
        <p className="mono" style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--fg-4)', marginTop: 12, lineHeight: 1.5 }}>Next: a quick verbal check with your AI Manager before you work solo.</p>
      )}
    </div>
  );
}

/* main interactive flow */
function QuizFlow({ onClose, onVerify, initial }) {
  const quiz = window.AMM.quiz;
  const [phase, setPhase] = useStateQ(initial ? initial.phase : 'intro'); // intro | q | result
  const [idx, setIdx] = useStateQ(initial ? (initial.idx || 0) : 0);
  const [responses, setResponses] = useStateQ(initial ? initial.responses : {});
  const [mode, setMode] = useStateQ('tap'); // tap | voice

  const q = quiz.questions[idx];
  const locked = !!(q && responses[q.id]);
  const results = quiz.questions.map((qq) => responses[qq.id] ? responses[qq.id].correct : null);

  function answer(r) { setResponses((p) => ({ ...p, [q.id]: r })); }
  function next() {
    if (idx < quiz.questions.length - 1) setIdx(idx + 1);
    else setPhase('result');
  }
  function retake() { setResponses({}); setIdx(0); setPhase('intro'); }

  // INTRO
  if (phase === 'intro') {
    return (
      <QChrome title="AI Training Quiz" onClose={onClose}>
        <div style={{ padding: '22px 18px 24px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
          <div className="card" style={{ padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, background: 'var(--surface-2)' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeContent: 'center', flex: 'none' }}><I.video size={16} style={{ color: 'var(--fg-3)' }} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 540 }}>{quiz.sop}</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>Watched · {quiz.module}</div>
            </div>
            <span className="chip good" style={{ height: 20 }}><I.check size={11} sw={2.4} /></span>
          </div>

          <AiBubble>{quiz.intro}</AiBubble>

          <div style={{ display: 'flex', gap: 8, margin: '18px 0', flexWrap: 'wrap' }}>
            {[['checklist', `${quiz.questions.length} questions`], ['clock', '~1 min'], ['mic', 'Type, tap or speak']].map(([ic, t], i) => {
              const Ico = I[ic];
              return <span key={i} className="chip" style={{ height: 28 }}><Ico size={13} /> {t}</span>;
            })}
          </div>

          <div style={{ flex: 1 }} />
          <button onClick={() => setPhase('q')} style={{ width: '100%', height: 50, borderRadius: 13, border: 'none', background: 'var(--fg)', color: 'var(--bg)', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
            Start quiz <I.arrow size={18} />
          </button>
          <p className="mono" style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--fg-4)', marginTop: 12, lineHeight: 1.5 }}>The AI checks each answer instantly and explains why.</p>
        </div>
      </QChrome>
    );
  }

  // RESULT
  if (phase === 'result') {
    return (
      <QChrome title="Quiz results" onClose={onClose}>
        <QuizResult quiz={quiz} responses={responses} onClose={onClose} onRetake={retake} onVerify={onVerify} />
      </QChrome>
    );
  }

  // QUESTION
  const modeToggle = q.type === 'text'
    ? <button onClick={() => setMode(mode === 'tap' ? 'voice' : 'tap')} style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: mode === 'voice' ? 'var(--fg)' : 'transparent', color: mode === 'voice' ? 'var(--bg)' : 'var(--fg-3)', display: 'grid', placeContent: 'center', cursor: 'pointer' }}>{mode === 'voice' ? <I.mic size={16} /> : <I.mic size={16} />}</button>
    : null;

  return (
    <QChrome title="AI Training Quiz" onClose={onClose} right={modeToggle}>
      <ProgressDots n={quiz.questions.length} current={idx} results={results} />
      <Question q={q} locked={locked} response={responses[q.id]} onAnswer={answer} mode={mode} />
      {locked && (
        <div style={{ padding: '0 18px 26px' }}>
          <button onClick={next} style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', background: 'var(--fg)', color: 'var(--bg)', fontSize: 14.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
            {idx < quiz.questions.length - 1 ? 'Next question' : 'See results'} <I.arrow size={17} />
          </button>
        </div>
      )}
    </QChrome>
  );
}

/* ── Voice-based quiz mode (hero) ── */
function QuizVoice({ onClose }) {
  const quiz = window.AMM.quiz;
  const q = quiz.questions[0];
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', color: 'var(--fg)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: .4, maskImage: 'radial-gradient(80% 55% at 50% 18%, black, transparent)' }} />
      {onClose && <button onClick={onClose} style={{ position: 'absolute', top: 14, left: 14, zIndex: 10, width: 34, height: 34, borderRadius: 9, border: 'none', background: 'var(--surface-2)', color: 'var(--fg-2)', display: 'grid', placeContent: 'center', cursor: 'pointer' }}><I.close size={17} /></button>}

      <div style={{ position: 'relative', paddingTop: 60, textAlign: 'center' }}>
        <div className="eyebrow" style={{ fontSize: 10 }}>AI Training Quiz · Voice mode</div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 7 }}>Question 1 of {quiz.questions.length} · {q.topic}</div>
      </div>

      <div style={{ position: 'relative', display: 'flex', gap: 4, padding: '14px 40px 0', width: '100%', boxSizing: 'border-box', justifyContent: 'center' }}>
        {quiz.questions.map((_, i) => <span key={i} style={{ width: 26, height: 4, borderRadius: 99, background: i === 0 ? 'var(--fg)' : 'var(--border-strong)' }} />)}
      </div>

      <div style={{ position: 'relative', marginTop: 26, marginBottom: 8 }}>
        <div className="amm-orb" style={{ width: 132, height: 132, borderRadius: 99, background: 'radial-gradient(circle at 38% 32%, var(--fg), color-mix(in oklab, var(--fg) 50%, var(--bg)))', boxShadow: '0 0 70px -10px color-mix(in oklab, var(--fg) 38%, transparent)' }} />
      </div>

      <div style={{ position: 'relative', display: 'flex', gap: 3, alignItems: 'center', height: 32, marginTop: 8 }}>
        {Array.from({ length: 23 }).map((_, i) => (
          <span key={i} className="amm-bar" style={{ width: 3, borderRadius: 2, background: 'var(--fg-2)', animationDelay: `${i * 0.06}s`, height: `${12 + Math.abs(Math.sin(i)) * 22}px` }} />
        ))}
      </div>

      {/* transcript */}
      <div style={{ position: 'relative', margin: '22px 22px 0', display: 'flex', flexDirection: 'column', gap: 10, width: 'calc(100% - 44px)' }}>
        <div style={{ fontSize: 13.5, lineHeight: 1.45, padding: '11px 14px', borderRadius: '4px 14px 14px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <span className="mono" style={{ fontSize: 9, color: 'var(--fg-4)', display: 'block', marginBottom: 4 }}>AI ASKS</span>
          {q.q}
        </div>
        <div style={{ alignSelf: 'flex-end', maxWidth: '82%', fontSize: 13.5, lineHeight: 1.4, padding: '10px 14px', borderRadius: '14px 4px 14px 14px', background: 'var(--fg)', color: 'var(--bg)' }}>
          “Two minutes.”
        </div>
      </div>

      {/* mic control */}
      <div style={{ position: 'absolute', bottom: 46, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <button style={{ width: 64, height: 64, borderRadius: 99, border: 'none', background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center', cursor: 'pointer', boxShadow: '0 8px 30px -8px color-mix(in oklab, var(--fg) 45%, transparent)' }}><I.mic size={26} /></button>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>Listening… speak your answer</span>
      </div>
    </div>
  );
}

Object.assign(window, { QuizFlow, QuizVoice });
