/* AI MIDDLE MANAGER — shell: sidebar + topbar */

const NAV = [
  { group: 'Operate', items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { id: 'tasks', label: 'Tasks', icon: 'checklist', badge: '42' },
    { id: 'escalations', label: 'Escalations', icon: 'alert', badge: '4', badgeCrit: true },
    { id: 'quality', label: 'Quality Inspection', icon: 'scan' },
  ]},
  { group: 'People', items: [
    { id: 'employees', label: 'Employees', icon: 'users' },
    { id: 'conversations', label: 'AI Conversations', icon: 'chat' },
    { id: 'verifications', label: 'Verification Calls', icon: 'mic', badge: '6' },
  ]},
  { group: 'Knowledge', items: [
    { id: 'sops', label: 'SOP Knowledge Base', icon: 'book' },
    { id: 'analytics', label: 'Analytics', icon: 'chart' },
  ]},
];

function Sidebar({ view, setView }) {
  return (
    <aside style={{
      width: 248, flex: 'none', height: '100%', borderRight: '1px solid var(--border)',
      background: 'var(--bg-2)', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 5,
    }}>
      {/* brand */}
      <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--fg)', color: 'var(--bg)', display: 'grid', placeContent: 'center' }}>
          <I.logo size={18} />
        </div>
        <div style={{ lineHeight: 1.25, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>AI Middle Manager</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '.02em', whiteSpace: 'nowrap' }}>Resthaus Operations</div>
        </div>
      </div>

      {/* org switch */}
      <div style={{ padding: '0 12px 10px' }}>
        <button className="btn" style={{ width: '100%', justifyContent: 'space-between', height: 38, background: 'var(--surface)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <I.pin size={15} style={{ color: 'var(--fg-3)' }} />
            <span style={{ fontSize: 12.5 }}>All 7 locations</span>
          </span>
          <I.down size={14} style={{ color: 'var(--fg-3)' }} />
        </button>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 12px' }}>
        {NAV.map((g) => (
          <div key={g.group} style={{ marginBottom: 14 }}>
            <div className="eyebrow" style={{ padding: '6px 8px', fontSize: 10 }}>{g.group}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {g.items.map((it) => {
                const Ico = I[it.icon];
                const active = view === it.id;
                return (
                  <button key={it.id} onClick={() => setView(it.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '7px 9px', borderRadius: 8, border: '1px solid transparent',
                      background: active ? 'var(--active)' : 'transparent',
                      color: active ? 'var(--fg)' : 'var(--fg-2)', cursor: 'pointer',
                      font: 'inherit', fontSize: 13, fontWeight: active ? 500 : 440, textAlign: 'left',
                      transition: 'background .12s, color .12s',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--hover)'; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                    <Ico size={17} style={{ color: active ? 'var(--fg)' : 'var(--fg-3)' }} />
                    <span style={{ flex: 1 }}>{it.label}</span>
                    {it.badge && (
                      <span className="mono tnum" style={{
                        fontSize: 10.5, padding: '1px 6px', borderRadius: 99,
                        background: it.badgeCrit ? 'var(--crit-soft)' : 'var(--active)',
                        color: it.badgeCrit ? 'var(--crit)' : 'var(--fg-2)',
                      }}>{it.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* manager card */}
      <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
        <a href="manager-mobile.html" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', marginBottom: 2, borderRadius: 8, textDecoration: 'none', color: 'var(--fg-2)', fontSize: 12.5 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
          <I.grid size={16} style={{ color: 'var(--fg-3)' }} />
          <span style={{ flex: 1 }}>Manager mobile</span>
          <I.arrow size={13} style={{ color: 'var(--fg-4)', transform: 'rotate(-45deg)' }} />
        </a>
        <a href="mobile.html" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', marginBottom: 4, borderRadius: 8, textDecoration: 'none', color: 'var(--fg-2)', fontSize: 12.5 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
          <I.phone size={16} style={{ color: 'var(--fg-3)' }} />
          <span style={{ flex: 1 }}>Employee app</span>
          <I.arrow size={13} style={{ color: 'var(--fg-4)', transform: 'rotate(-45deg)' }} />
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 6px' }}>
          <Av initials="JM" size={32} online />
          <div style={{ flex: 1, lineHeight: 1.2 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>John Mercer</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>Regional Manager</div>
          </div>
          <I.gear size={16} style={{ color: 'var(--fg-3)' }} />
        </div>
      </div>
    </aside>
  );
}

function Topbar({ view, theme, setTheme, onAsk }) {
  const titles = {
    dashboard: 'Dashboard', tasks: 'Tasks', escalations: 'Escalation Center',
    quality: 'AI Quality Inspection', employees: 'Employees', conversations: 'AI Conversations',
    sops: 'SOP Knowledge Base', analytics: 'Analytics & Insights',
    verifications: 'AI Knowledge Verification Calls',
  };
  return (
    <header style={{
      height: 58, flex: 'none', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px',
      background: 'color-mix(in oklab, var(--bg) 80%, transparent)', backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0 }}>
        <h1 style={{ fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap' }}>{titles[view]}</h1>
        <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>· Tue 3 Jun</span>
      </div>

      <div style={{ flex: 1 }} />

      <button onClick={onAsk} className="btn btn-sm" style={{ gap: 7 }}>
        <I.spark size={14} /> Ask the AI Manager
        <kbd className="mono" style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border-2)', color: 'var(--fg-3)' }}>⌘K</kbd>
      </button>

      <div style={{ width: 1, height: 22, background: 'var(--border)' }} />

      <button className="btn btn-icon btn-ghost" title="Search"><I.search size={17} /></button>
      <button className="btn btn-icon btn-ghost" title="Notifications" style={{ position: 'relative' }}>
        <I.bell size={17} />
        <span style={{ position: 'absolute', top: 7, right: 8, width: 6, height: 6, borderRadius: 99, background: 'var(--crit)', boxShadow: '0 0 0 2px var(--bg)' }} />
      </button>
      <button className="btn btn-icon btn-ghost" title="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        {theme === 'dark' ? <I.sun size={17} /> : <I.moon size={17} />}
      </button>
    </header>
  );
}

Object.assign(window, { Sidebar, Topbar, NAV });
