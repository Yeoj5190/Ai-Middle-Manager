// Shared presentational primitives, ported from the prototype's icons.jsx + ui.jsx.
// All server-safe (no hooks / no client state).
import type { CSSProperties, ReactNode } from "react";

export function scoreColor(v: number): string {
  return v >= 90 ? "var(--good)" : v >= 75 ? "var(--warn)" : "var(--crit)";
}

// ── icons ────────────────────────────────────────────────────────────────────
interface IconProps {
  size?: number;
  sw?: number;
  style?: CSSProperties;
  className?: string;
}
type IconFn = (p: IconProps) => ReactNode;

function svg(size = 18, sw = 1.6, style?: CSSProperties, children?: ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: "none", ...style }}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const I: Record<string, IconFn> = {
  search: ({ size, sw, style }) =>
    svg(size, sw, style, (<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>)),
  filter: ({ size, sw, style }) => svg(size, sw, style, <path d="M4 5h16l-6 7v6l-4 2v-8z" />),
  arrow: ({ size, sw, style }) =>
    svg(size, sw, style, (<><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>)),
  up: ({ size, sw, style }) => svg(size, sw, style, <path d="M6 14l6-6 6 6" />),
  down: ({ size, sw, style }) => svg(size, sw, style, <path d="M6 10l6 6 6-6" />),
  users: ({ size, sw, style }) =>
    svg(size, sw, style, (<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6" /><path d="M17.5 13.6A5.5 5.5 0 0 1 20.5 18.5" /></>)),
  pin: ({ size, sw, style }) =>
    svg(size, sw, style, (<><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" /></>)),
  clock: ({ size, sw, style }) =>
    svg(size, sw, style, (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>)),
  chat: ({ size, sw, style }) => svg(size, sw, style, <path d="M4 5h16v11H9l-4 3v-3H4z" />),
  send: ({ size, sw, style }) =>
    svg(size, sw, style, (<><path d="M4 12L20 4l-6 16-3-7z" /><path d="M11 13l9-9" /></>)),
  brain: ({ size, sw, style }) =>
    svg(size, sw, style, (<><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 1 5 3 3 0 0 0 3 3 2 2 0 0 0 3 0V4a2 2 0 0 0-3 0z" /><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-1 5 3 3 0 0 1-3 3" /></>)),
  video: ({ size, sw, style }) =>
    svg(size, sw, style, (<><rect x="3" y="6" width="12" height="12" rx="2" /><path d="M15 10l6-3v10l-6-3z" /></>)),
  close: ({ size, sw, style }) =>
    svg(size, sw, style, (<><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>)),
  spark: ({ size, sw, style }) =>
    svg(size, sw, style, (<><path d="M12 3v4" /><path d="M12 17v4" /><path d="M3 12h4" /><path d="M17 12h4" /><path d="M5.6 5.6l2.8 2.8" /><path d="M15.6 15.6l2.8 2.8" /><path d="M18.4 5.6l-2.8 2.8" /><path d="M8.4 15.6l-2.8 2.8" /></>)),
  replay: ({ size, sw, style }) =>
    svg(size, sw, style, (<><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M3.2 3.6v3.4h3.4" /></>)),
  check: ({ size, sw, style }) => svg(size, sw, style, <path d="M5 12.5l4 4 10-10" />),
  logo: ({ size, sw, style }) =>
    svg(size, sw ?? 1.7, style, (<><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M8 16V9l4 4 4-4v7" /></>)),
  mic: ({ size, sw, style }) =>
    svg(size, sw, style, (<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>)),
  sun: ({ size, sw, style }) =>
    svg(size, sw, style, (<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></>)),
  moon: ({ size, sw, style }) =>
    svg(size, sw, style, <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />),
  book: ({ size, sw, style }) =>
    svg(size, sw, style, (<><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h11" /></>)),
  scan: ({ size, sw, style }) =>
    svg(size, sw, style, (<><path d="M4 8V5a1 1 0 0 1 1-1h3" /><path d="M20 8V5a1 1 0 0 0-1-1h-3" /><path d="M4 16v3a1 1 0 0 0 1 1h3" /><path d="M20 16v3a1 1 0 0 1-1 1h-3" /><path d="M7 12h10" /></>)),
  phone: ({ size, sw, style }) =>
    svg(size, sw, style, <path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />),
  calendar: ({ size, sw, style }) =>
    svg(size, sw, style, (<><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M4 9h16M8 3v4M16 3v4" /></>)),
};

// ── avatar ───────────────────────────────────────────────────────────────────
export function Av({
  initials,
  size = 34,
  online,
}: {
  initials: string;
  size?: number;
  online?: boolean;
}) {
  return (
    <span
      className={"avatar" + (online ? " online" : "")}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}

// ── sparkline ────────────────────────────────────────────────────────────────
export function Sparkline({
  data,
  w = 72,
  h = 24,
  invert = false,
}: {
  data: number[];
  w?: number;
  h?: number;
  invert?: boolean;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const nx = (i: number) => (i / (data.length - 1)) * w;
  const ny = (v: number) => h - ((v - min) / (max - min || 1)) * (h - 3) - 1.5;
  const dpath = data.map((v, i) => `${i ? "L" : "M"}${nx(i).toFixed(1)} ${ny(v).toFixed(1)}`).join(" ");
  const last = data[data.length - 1];
  const good = invert ? last <= data[0] : last >= data[0];
  const col = good ? "var(--good)" : "var(--crit)";
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <path d={`${dpath} L${w} ${h} L0 ${h} Z`} fill={col} opacity="0.08" />
      <path d={dpath} fill="none" stroke={col} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={nx(data.length - 1)} cy={ny(last)} r="2.2" fill={col} />
    </svg>
  );
}

// ── delta pill ───────────────────────────────────────────────────────────────
export function Delta({
  value,
  dir,
  invert,
}: {
  value: string;
  dir: "up" | "down";
  invert?: boolean;
}) {
  const positive = invert ? dir === "down" : dir === "up";
  const col = positive ? "var(--good)" : "var(--crit)";
  const Arrow = dir === "up" ? I.up : I.down;
  return (
    <span
      className="mono"
      style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 11.5, color: col, fontWeight: 500 }}
    >
      <Arrow size={12} sw={2.2} /> {value}
    </span>
  );
}

// ── ring gauge ───────────────────────────────────────────────────────────────
export function Ring({
  value,
  size = 132,
  stroke = 9,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const acc = scoreColor(value);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--active)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={acc}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s var(--ease)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", textAlign: "center" }}>
        <div className="mono tnum" style={{ fontSize: size * 0.26, fontWeight: 600, letterSpacing: "-.02em" }}>
          {value}
        </div>
        {label && <div className="eyebrow" style={{ marginTop: 2 }}>{label}</div>}
      </div>
    </div>
  );
}

// ── vertical bars ────────────────────────────────────────────────────────────
export function VBars({
  data,
  labels,
  h = 150,
  color = "var(--fg)",
}: {
  data: number[];
  labels: string[];
  h?: number;
  color?: string;
}) {
  const max = Math.max(...data) * 1.15;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: h }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}
        >
          <div
            style={{
              width: "100%",
              height: `${(v / max) * 100}%`,
              background: color,
              borderRadius: "4px 4px 2px 2px",
              minHeight: 3,
              opacity: i === data.length - 1 ? 1 : 0.42,
              transition: "height .6s var(--ease)",
            }}
          />
          <div className="mono" style={{ fontSize: 9, color: "var(--fg-3)" }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

// ── metric bar + score pill ──────────────────────────────────────────────────
export function MetricBar({ label, v }: { label: string; v: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: "var(--fg-2)" }}>{label}</span>
        <span className="mono tnum" style={{ color: scoreColor(v), fontWeight: 600 }}>{v}</span>
      </div>
      <div className="meter"><i style={{ width: `${v}%`, background: scoreColor(v) }} /></div>
    </div>
  );
}

export function ScorePill({ v, sm }: { v: number; sm?: boolean }) {
  const c = scoreColor(v);
  return (
    <span
      className="mono tnum"
      style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: sm ? 12 : 13, fontWeight: 600, color: c }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 99, background: c }} /> {v}
    </span>
  );
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 14) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}
