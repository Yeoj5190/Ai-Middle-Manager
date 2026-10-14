/* AI MIDDLE MANAGER — icon set (simple line icons) */
const Icon = ({ d, paths, size = 18, sw = 1.6, fill, style, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || 'none'}
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
       style={{ flex: 'none', ...style }} aria-hidden="true">
    {d && <path d={d} />}
    {paths && paths.map((p, i) => <path key={i} d={p} />)}
    {children}
  </svg>
);

const I = {
  spark:  (p) => <Icon {...p} paths={['M12 3v4','M12 17v4','M3 12h4','M17 12h4','M5.6 5.6l2.8 2.8','M15.6 15.6l2.8 2.8','M18.4 5.6l-2.8 2.8','M8.4 15.6l-2.8 2.8']} />,
  grid:   (p) => <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></Icon>,
  users:  (p) => <Icon {...p}><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6"/><path d="M17.5 13.6A5.5 5.5 0 0 1 20.5 18.5"/></Icon>,
  chat:   (p) => <Icon {...p} d="M4 5h16v11H9l-4 3v-3H4z"/>,
  book:   (p) => <Icon {...p} paths={['M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z','M5 17a3 3 0 0 1 3-3h11']} />,
  scan:   (p) => <Icon {...p} paths={['M4 8V5a1 1 0 0 1 1-1h3','M20 8V5a1 1 0 0 0-1-1h-3','M4 16v3a1 1 0 0 0 1 1h3','M20 16v3a1 1 0 0 1-1 1h-3','M7 12h10']} />,
  alert:  (p) => <Icon {...p} paths={['M12 3l9 16H3z','M12 10v4','M12 17v.5']} />,
  check:  (p) => <Icon {...p} paths={['M5 12.5l4 4 10-10']} />,
  checklist:(p)=> <Icon {...p} paths={['M9 6h11','M9 12h11','M9 18h11','M4 6l1 1 2-2','M4 12l1 1 2-2','M4 18l1 1 2-2']} />,
  chart:  (p) => <Icon {...p} paths={['M4 20V4','M4 20h16','M8 16v-4','M12 16V8','M16 16v-7','M20 16v-2']} />,
  bolt:   (p) => <Icon {...p} d="M13 3L5 13h5l-1 8 8-11h-5z" />,
  gear:   (p) => <Icon {...p}><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9L5.3 5.3"/></Icon>,
  search: (p) => <Icon {...p}><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></Icon>,
  bell:   (p) => <Icon {...p} paths={['M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6','M10 20a2 2 0 0 0 4 0']} />,
  sun:    (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></Icon>,
  moon:   (p) => <Icon {...p} d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  arrow:  (p) => <Icon {...p} paths={['M5 12h14','M13 6l6 6-6 6']} />,
  up:     (p) => <Icon {...p} paths={['M6 14l6-6 6 6']} />,
  down:   (p) => <Icon {...p} paths={['M6 10l6 6 6-6']} />,
  pin:    (p) => <Icon {...p}><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></Icon>,
  phone:  (p) => <Icon {...p} d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  clock:  (p) => <Icon {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></Icon>,
  dot:    (p) => <Icon {...p} fill="currentColor"><circle cx="12" cy="12" r="3.5" stroke="none"/></Icon>,
  close:  (p) => <Icon {...p} paths={['M6 6l12 12','M18 6L6 18']} />,
  plus:   (p) => <Icon {...p} paths={['M12 5v14','M5 12h14']} />,
  filter: (p) => <Icon {...p} d="M4 5h16l-6 7v6l-4 2v-8z" />,
  doc:    (p) => <Icon {...p} paths={['M6 3h8l4 4v14H6z','M14 3v4h4','M9 12h6','M9 16h6']} />,
  video:  (p) => <Icon {...p}><rect x="3" y="6" width="12" height="12" rx="2"/><path d="M15 10l6-3v10l-6-3z"/></Icon>,
  image:  (p) => <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5-5-7 7"/></Icon>,
  send:   (p) => <Icon {...p} paths={['M4 12L20 4l-6 16-3-7z','M11 13l9-9']} />,
  camera: (p) => <Icon {...p}><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.4"/></Icon>,
  calendar:(p)=> <Icon {...p}><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/></Icon>,
  flag:   (p) => <Icon {...p} paths={['M6 21V4','M6 5h11l-2 3 2 3H6']} />,
  trend:  (p) => <Icon {...p} paths={['M3 16l5-5 4 3 8-9','M16 5h5v5']} />,
  shield: (p) => <Icon {...p} paths={['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z','M9 12l2 2 4-4']} />,
  logo:   (p) => <Icon {...p} sw={1.7}><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M8 16V9l4 4 4-4v7"/></Icon>,
  mic:    (p) => <Icon {...p}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></Icon>,
  award:  (p) => <Icon {...p}><circle cx="12" cy="9" r="5"/><path d="M9 13.4L8 21l4-2 4 2-1-7.6"/></Icon>,
  replay: (p) => <Icon {...p} paths={['M4 12a8 8 0 1 0 2.4-5.7','M3.2 3.6v3.4h3.4']} />,
  brain:  (p) => <Icon {...p}><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 1 5 3 3 0 0 0 3 3 2 2 0 0 0 3 0V4a2 2 0 0 0-3 0z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-1 5 3 3 0 0 1-3 3"/></Icon>,
};
window.I = I;
window.Icon = Icon;
