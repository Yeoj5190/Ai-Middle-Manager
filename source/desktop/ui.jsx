/* AI MIDDLE MANAGER — shared UI + charts */
const { useState, useEffect, useRef, useMemo } = React;

/* ---------- Sparkline ---------- */
function Sparkline({ data, w = 72, h = 24, invert = false }) {
  const min = Math.min(...data), max = Math.max(...data);
  const nx = (i) => (i / (data.length - 1)) * w;
  const ny = (v) => h - ((v - min) / (max - min || 1)) * (h - 3) - 1.5;
  const dpath = data.map((v, i) => `${i ? 'L' : 'M'}${nx(i).toFixed(1)} ${ny(v).toFixed(1)}`).join(' ');
  const last = data[data.length - 1];
  const good = invert ? last <= data[0] : last >= data[0];
  const col = good ? 'var(--good)' : 'var(--crit)';
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <path d={`${dpath} L${w} ${h} L0 ${h} Z`} fill={col} opacity="0.08" />
      <path d={dpath} fill="none" stroke={col} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={nx(data.length - 1)} cy={ny(last)} r="2.2" fill={col} />
    </svg>
  );
}

/* ---------- Delta pill ---------- */
function Delta({ value, dir, invert }) {
  const positive = invert ? dir === 'down' : dir === 'up';
  const col = positive ? 'var(--good)' : 'var(--crit)';
  const Arrow = dir === 'up' ? I.up : I.down;
  return (
    <span className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11.5, color: col, fontWeight: 500 }}>
      <Arrow size={12} sw={2.2} /> {value}
    </span>
  );
}

/* ---------- Ring gauge ---------- */
function Ring({ value, size = 132, stroke = 9, label, sub, color = 'var(--accent)' }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const acc = color === 'var(--accent)'
    ? (value >= 90 ? 'var(--good)' : value >= 75 ? 'var(--warn)' : 'var(--crit)') : color;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--active)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={acc} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s var(--ease)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center' }}>
        <div className="mono tnum" style={{ fontSize: size * .26, fontWeight: 600, letterSpacing: '-.02em' }}>{value}</div>
        {label && <div className="eyebrow" style={{ marginTop: 2 }}>{label}</div>}
      </div>
    </div>
  );
}

/* ---------- Multi-line chart ---------- */
function LineChart({ series, labels, h = 200, yMax = 100, yMin = 0, fmt = (v)=>v }) {
  const pad = { l: 30, r: 8, t: 12, b: 22 };
  const ref = useRef(null);
  const [w, setW] = useState(560);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current); return () => ro.disconnect();
  }, []);
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const nx = (i) => pad.l + (i / (labels.length - 1)) * iw;
  const ny = (v) => pad.t + ih - ((v - yMin) / (yMax - yMin)) * ih;
  const ticks = 4;
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width={w} height={h}>
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const v = yMin + (i / ticks) * (yMax - yMin);
          const y = ny(v);
          return (
            <g key={i}>
              <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="var(--border)" strokeDasharray="2 4" />
              <text x={pad.l - 7} y={y + 3} textAnchor="end" className="mono" fontSize="9.5" fill="var(--fg-3)">{fmt(Math.round(v))}</text>
            </g>
          );
        })}
        {labels.map((l, i) => (i % 2 === 0) && (
          <text key={i} x={nx(i)} y={h - 6} textAnchor="middle" className="mono" fontSize="9.5" fill="var(--fg-3)">{l}</text>
        ))}
        {series.map((s, si) => {
          const dp = s.data.map((v, i) => `${i ? 'L' : 'M'}${nx(i).toFixed(1)} ${ny(v).toFixed(1)}`).join(' ');
          return (
            <g key={si}>
              {s.fill && <path d={`${dp} L${nx(s.data.length-1)} ${ny(yMin)} L${nx(0)} ${ny(yMin)} Z`} fill={s.color} opacity="0.07" />}
              <path d={dp} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={nx(s.data.length - 1)} cy={ny(s.data[s.data.length - 1])} r="3" fill={s.color} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- Horizontal bars ---------- */
function HBars({ rows, max = 100, fmt = (v) => v + '%' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 46px', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12.5, color: 'var(--fg-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</div>
          <div className="meter" style={{ height: 8 }}>
            <i style={{ width: `${(r.value / max) * 100}%`, background: r.color || 'var(--fg)' }} />
          </div>
          <div className="mono tnum" style={{ fontSize: 12, textAlign: 'right', color: 'var(--fg)' }}>{fmt(r.value)}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Vertical bar chart ---------- */
function VBars({ data, labels, h = 150, color = 'var(--fg)', fmt = (v)=>v }) {
  const max = Math.max(...data) * 1.15;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: h }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', height: `${(v / max) * 100}%`, background: color, borderRadius: '4px 4px 2px 2px', minHeight: 3, opacity: i === data.length-1 ? 1 : .42, transition: 'height .6s var(--ease)' }} />
          <div className="mono" style={{ fontSize: 9, color: 'var(--fg-3)' }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Section header ---------- */
function SectionTitle({ eyebrow, title, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
        <h2 style={{ fontSize: 19 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ---------- Avatar ---------- */
function Av({ initials, size = 34, online }) {
  return (
    <span className={'avatar' + (online ? ' online' : '')} style={{ width: size, height: size, fontSize: size * .36 }}>
      {initials}
    </span>
  );
}

/* ---------- Score badge by value ---------- */
function scoreColor(v) { return v >= 90 ? 'var(--good)' : v >= 75 ? 'var(--warn)' : 'var(--crit)'; }

Object.assign(window, { Sparkline, Delta, Ring, LineChart, HBars, VBars, SectionTitle, Av, scoreColor });
