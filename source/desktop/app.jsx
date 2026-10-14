/* AI MIDDLE MANAGER — Ask-AI command palette + App root */

function AskAI({ open, onClose, setView }) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);
  const suggestions = [
    { icon: 'alert', text: 'What needs my attention right now?', view: 'escalations' },
    { icon: 'users', text: 'Which employees need follow-up?', view: 'employees' },
    { icon: 'pin',   text: 'Why did Granville drop this week?', view: 'analytics' },
    { icon: 'scan',  text: 'Show me failed inspections today', view: 'quality' },
    { icon: 'book',  text: 'Which SOPs are not being followed?', view: 'sops' },
  ];
  if (!open) return null;
  const answer = 'Across all 7 locations, Granville is your priority: room inspections dropped 18%, 3 SOP violations were logged, and there are 3 open escalations (1 critical HVAC failure). Marcus Hale needs a coaching check-in. Everything else is tracking on or above target.';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'start center', paddingTop: '12vh', background: 'color-mix(in oklab, var(--bg) 55%, transparent)', backdropFilter: 'blur(7px)' }} onClick={onClose}>
      <div className="card fade-up" style={{ width: 'min(620px, 92vw)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 26, height: 26, flex: 'none', borderRadius: 8, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.spark size={15} /></div>
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask the AI Operations Manager…"
            style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--fg)', font: 'inherit', fontSize: 15, outline: 'none' }} />
          <kbd className="mono" style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border-2)', color: 'var(--fg-3)' }}>esc</kbd>
        </div>

        {q.trim().length > 0 ? (
          <div style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, flex: 'none', borderRadius: 7, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}><I.spark size={13} /></div>
              <div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--fg)', textWrap: 'pretty' }}>{answer}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button className="btn btn-sm btn-primary" onClick={() => { onClose(); setView('escalations'); }}>Open Granville escalations</button>
                  <button className="btn btn-sm" onClick={() => { onClose(); setView('analytics'); }}>See analytics</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '10px 10px 12px' }}>
            <div className="eyebrow" style={{ padding: '8px 12px 6px', fontSize: 10 }}>Suggested</div>
            {suggestions.map((s, i) => {
              const Ico = I[s.icon];
              return (
                <button key={i} onClick={() => { onClose(); setView(s.view); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '11px 12px', borderRadius: 9, border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit', color: 'var(--fg)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <Ico size={16} style={{ color: 'var(--fg-3)' }} />
                  <span style={{ flex: 1, fontSize: 13.5 }}>{s.text}</span>
                  <I.arrow size={14} style={{ color: 'var(--fg-4)' }} />
                </button>
              );
            })}
          </div>
        )}
        <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-4)' }}>AI Operations Manager · monitors 7 locations · 26 staff</span>
          <span style={{ flex: 1 }} />
          <span className="chip good" style={{ height: 19, fontSize: 9.5 }}><span className="dot" />online</span>
        </div>
      </div>
    </div>
  );
}

const FONTS = {
  Geist:  { sans: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif", label: 'Geist' },
  System: { sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif", label: 'System' },
  Serif:  { sans: "'Geist', sans-serif", display: "'Newsreader', Georgia, serif", label: 'Serif display' },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accent": "mono",
  "font": "Geist",
  "density": "regular"
}/*EDITMODE-END*/;

function AccentSwatches({ value, onChange }) {
  const opts = [
    { id: 'mono', c: 'var(--fg)' }, { id: 'indigo', c: '#7c7bf0' },
    { id: 'emerald', c: '#34c98a' }, { id: 'blue', c: '#5b9bff' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
      {opts.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)} title={o.id}
          style={{ width: 30, height: 30, borderRadius: 8, background: o.c, cursor: 'pointer',
            border: value === o.id ? '2px solid var(--fg)' : '1px solid var(--border-2)',
            outline: value === o.id ? '2px solid var(--bg)' : 'none', outlineOffset: -4 }} />
      ))}
    </div>
  );
}

function App() {
  const [view, setView] = useState('dashboard');
  const [ask, setAsk] = useState(false);
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const theme = t.theme;
  const setTheme = (v) => setTweak('theme', v);

  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('data-theme', t.theme);
    el.setAttribute('data-accent', t.accent === 'mono' ? '' : t.accent);
    const f = FONTS[t.font] || FONTS.Geist;
    el.style.setProperty('--font-sans', f.sans);
    el.style.setProperty('--font-display', f.display || f.sans);
    const pad = t.density === 'compact' ? '16px 20px 48px' : t.density === 'comfy' ? '32px 40px 72px' : '24px 28px 60px';
    el.style.setProperty('--main-pad', pad);
  }, [t]);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setAsk((v) => !v); }
      if (e.key === 'Escape') setAsk(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const views = {
    dashboard: <Dashboard setView={setView} />,
    tasks: <Tasks />,
    escalations: <Escalations />,
    quality: <Quality />,
    employees: <Employees setView={setView} />,
    conversations: <Conversations />,
    verifications: <Verifications />,
    sops: <Sops />,
    analytics: <Analytics setView={setView} />,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar view={view} setView={setView} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        <Topbar view={view} theme={theme} setTheme={setTheme} onAsk={() => setAsk(true)} />
        <main key={view} style={{ flex: 1, overflowY: 'auto', padding: 'var(--main-pad, 24px 28px 60px)' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }} className="fade-up">
            {views[view]}
          </div>
        </main>
      </div>
      <AskAI open={ask} onClose={() => setAsk(false)} setView={setView} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Appearance" />
        <TweakRadio label="Theme" value={t.theme} options={['dark', 'light']} onChange={(v) => setTweak('theme', v)} />
        <TweakRow label="Accent"><AccentSwatches value={t.accent} onChange={(v) => setTweak('accent', v)} /></TweakRow>
        <TweakSection label="Typography" />
        <TweakSelect label="Font" value={t.font} options={Object.keys(FONTS)} onChange={(v) => setTweak('font', v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density} options={['compact', 'regular', 'comfy']} onChange={(v) => setTweak('density', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
