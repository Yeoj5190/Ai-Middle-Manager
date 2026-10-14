# Handoff: AI Middle Manager — Operations Platform

> Engineering handoff for the **AI Middle Manager** design prototype: a desktop manager
> dashboard, an employee mobile app, and a manager mobile app for AI‑supervised frontline
> operations (hotels, cleaning, aged care, maintenance, retail).

---

## 1. Overview

**AI Middle Manager** lets one manager supervise dozens–hundreds of frontline workers through
an AI "operations manager." The product spans three surfaces that share one data model:

| Surface | Entry file | Audience |
|---|---|---|
| **Desktop dashboard** | `index.html` | Managers / owners |
| **Employee mobile app** | `mobile.html` | Frontline workers |
| **Manager mobile app** | `manager-mobile.html` | Managers on the floor |

Signature features: an AI operations briefing, live ops monitoring, escalation center, AI quality
inspection (photo review), an **AI Training Quiz**, and **AI Knowledge Verification Calls** (a live
adaptive verbal competency check) — plus knowledge‑retention analytics.

---

## 2. About the design files

The files in this bundle are **design references built in HTML + React (via in‑browser Babel)**.
They are high‑fidelity prototypes showing the intended look, motion, and behavior — **not a
production build**. In‑browser Babel transpilation and CDN‑loaded React are used purely so the
prototype runs by opening a file; **do not ship this transpile-at-runtime setup**.

**Your task:** recreate these designs in the target codebase's environment using its established
patterns. If no codebase exists yet, the recommended stack is **Next.js (App Router) + React +
TypeScript + Tailwind**, which maps cleanly to the prototype. The JSX component structure here is
intentionally close to production React, so most components can be ported with light refactoring
(replace the global `window.*` exports with real ES module imports, replace inline-style objects
with Tailwind classes or CSS modules, and swap mock `window.AMM` data for API/React Query calls).

The fastest way to view the designs: open the **self‑contained files in `share/`**
(`AI-Middle-Manager-Desktop.html`, `…-Employee-App.html`, `…-Mobile.html`) — they run offline with
no dependencies.

---

## 3. Fidelity

**High‑fidelity.** Final colors, typography, spacing, motion, and interactions are all defined.
Recreate pixel‑accurately using the design tokens in §6. All values are theme variables (light +
dark) — do not hardcode hex; wire the tokens into your theme system.

---

## 4. Architecture of the prototype (file map)

The prototype is already componentized. Each `.jsx` file exports its components to `window` at the
bottom (`Object.assign(window, { … })`) and is loaded via `<script type="text/babel">`. In
production these become normal module imports.

```
shared/tokens.css        Design system: CSS variables (light/dark), base components
                         (.card .chip .btn .meter .avatar .ph .eyebrow .grid-bg), type scale

desktop/                 DESKTOP MANAGER APP (index.html)
  data.js                window.AMM — the entire mock data model (see §7). Single source of truth,
                         shared by ALL three surfaces.
  icons.jsx              I.* — line icon set (stroke SVGs)
  ui.jsx                 Charts + primitives: Sparkline, Delta, Ring, LineChart, HBars, VBars,
                         SectionTitle, Av (avatar), scoreColor()
  shell.jsx              Sidebar (NAV array), Topbar (titles map, ⌘K, theme toggle)
  dashboard.jsx          Executive dashboard: Briefing, StatCard, LocationCard, InsightRow,
                         RetentionCard (SOP Knowledge Retention)
  employees.jsx          EmployeeList, EmployeeProfile, KnowledgeRetention (quiz/retention panel)
  escalations.jsx        Escalation Center (master–detail, severity queue)
  tasks.jsx              Task board (kanban columns, AI-generated tasks)
  quality.jsx            AI Quality Inspection (before/after, detection boxes, AI checklist)
  conversations.jsx      AI Conversations (Voice/WhatsApp/Telegram/SMS transcripts)
  sops.jsx               SOP Knowledge Base (cards + modal detail)
  analytics.jsx          Analytics & Insights (+ SOP knowledge analytics, retraining queue)
  verifications.jsx      AI Knowledge Verification Calls module (recording, scores, transcript)
  tweaks-panel.jsx       In-prototype tweak controls (theme/accent/font/density) — NOT production
  app.jsx                Root: view router, ⌘K AskAI command palette, theme + tweaks wiring

mobile/                  MOBILE APPS
  ios-frame.jsx          IOSDevice — iPhone bezel/status bar wrapper (prototype chrome only)
  screens.jsx            EMPLOYEE app: HomeScreen, TasksScreen, TrainScreen, MeScreen, CallScreen,
                         PhotoScreen, TabBar, EmployeeApp (tab router)
  quiz.jsx               AI Training Quiz: QuizFlow (intro → Q&A → result), QuizVoice (voice mode)
  verify.jsx             VerificationCall — adaptive live verbal competency check + verdict
  manager.jsx            MANAGER app: HomeM, AlertsM, SitesM, TeamM, AskM, EscDetailM,
                         VerifyM + VCallDetailM (verification on mobile), ManagerApp (router)

index.html               Desktop entry (loads desktop/* in order)
mobile.html              Employee app showcase (3 device rows: product / quiz / verification)
manager-mobile.html      Manager app showcase (2 rows: command center / verification)
share/*.html             Self-contained offline builds (generated; do not edit by hand)
```

**Load order matters** in the prototype (data.js → icons → ui → feature files → app). In a module
system this is handled by imports; just preserve the dependency direction (everything depends on
the data layer, icons, and ui primitives).

---

## 5. Personas & roles (permissions)

| Role | Surface | Can do |
|---|---|---|
| **Owner / Regional Manager** | Desktop + Manager mobile | Everything: all locations, analytics, approve escalations, push SOPs, view all verification calls |
| **Operations Manager** | Desktop + Manager mobile | Assigned locations: tasks, escalations, employee profiles, verification results |
| **Supervisor** | Manager mobile | Single location: approve escalations, view team, trigger re-quiz/recall |
| **Frontline Employee** | Employee mobile | Own tasks, SOPs, training, quizzes, verification calls, AI voice help |
| **Trainer** | Desktop | SOP authoring, training assignment, quiz/verification config |
| **Admin** | Desktop | Org/locations/users, integrations, billing |

Implement as multi‑tenant org → locations → users with row‑level scoping (every record carries
`org_id` and usually `location_id`).

---

## 6. Design tokens

All tokens live in `shared/tokens.css` as CSS variables with `[data-theme="light"]` and
`[data-theme="dark"]` blocks. Theme is set on `document.documentElement`. **Port these into your
theme system; never hardcode the hex values.**

### Color (semantic)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` / `--bg-2` | near‑white warm | near‑black | page / rail backgrounds |
| `--surface` / `--surface-2` | `#fff` / `#f6f6f4` | `#131315` / `#18181b` | cards, insets |
| `--border` / `--border-2` / `--border-strong` | warm grays | cool grays | hairlines → strong |
| `--fg` … `--fg-4` | `#18181a`→`#a2a2a8` | `#f4f4f6`→`#5f5f66` | text high→low emphasis |
| `--good` / `--warn` / `--crit` / `--info` | green/amber/red/blue + `*-soft` fills | same hues | status |
| `--accent` | `--fg` (monochrome) | `--fg` | brand accent (kept neutral) |

The system is **monochrome + status color only** — accents are intentionally the foreground color.
Status colors appear only for state (pass/fail, severity, deltas).

### Type
- **Sans:** Geist (`--font-sans`). **Mono:** Geist Mono (`--font-mono`) for labels, numbers, IDs, eyebrows.
- Headings 600 weight, `letter-spacing: -0.02em`. Numbers use `.tnum` (tabular) + mono.
- Scale (desktop): page title 16, h2 19–25, stat numbers 24–36, body 13–15, labels/eyebrows 9–11 mono uppercase `letter-spacing .05em`.
- Mobile body 13–14, screen titles 20–26, captions 10–12.

### Radius / shadow / motion
- Radius: `--r-sm` ~7, `--r-md` ~10–12, cards 12–14, pills 99.
- Shadows: subtle; `--shadow-lg` for modals/overlays only.
- Easing: `--ease` (custom). Entrances use a `fade-up` (opacity+translateY). Orb/waveform use
  `orbPulse` / `ampBar` keyframes; all motion gated behind `prefers-reduced-motion`.
- Hit targets ≥ 44px on mobile.

### Reusable component classes (in tokens.css)
`.card` `.chip` (+`.good/.warn/.crit`) `.btn` (+`.btn-primary/.btn-sm/.btn-icon/.btn-ghost`)
`.meter` (progress bar) `.avatar` (+`.online`) `.ph` (striped image placeholder w/ mono label)
`.eyebrow` (mono uppercase label) `.grid-bg` (faint grid texture) `.tag` `.mono` `.tnum`.

> **Image placeholders:** the prototype never draws fake photos. `.ph` renders a subtly striped box
> with a monospace caption ("room photo", "training video"). In production, replace with real media
> slots.

---

## 7. Data model (mock → production)

`desktop/data.js` defines `window.AMM`, the complete mock dataset. **Treat it as the API contract.**
Each key maps to a table/endpoint. Entities and key fields:

- **locations**: `id, name, area, staff, open, quality, compliance, issues, trend`
- **employees**: `id, name, role, loc, locId, status(on/off‑shift), score (AI Performance Score),
  tasks, tasksWk, quality, sop, reliability, training, escalations, tenure, shift, channel, delta, initials`
- **tasks**: `id, title, loc, assignee, priority(high/med/low), status(todo/in‑progress/review/overdue/done), due, source(AI generated/Escalation/Compliance/Recurring SOP)`
- **escalations**: `id, sev(critical/high/med), title, loc, when, summary, action, evidence, owner`
- **conversations**: `id, emp, channel(Voice/WhatsApp/Telegram/SMS), when, dur, topic, summary, actions[], sentiment, transcript[{who,t}], escalated`
- **sops**: `id, title, cat, type(Document/Video/Checklist/Image), steps, usage, success, questions, incidents, updated, highlight, risk`
- **inspection**: `id, room, loc, employee, type, confidence, result, checks[{label,pass,note}], aiNote`
- **quiz**: `sop, sopId, intro, questions[{id, type(choice/text), topic, q, options[], answer, accept[], explain, explainWrong}]`
- **quizRecords**: per employee `{sop, score, total, knowledge, status(pass/needs‑review), missed[], trend[], attempts, rec}`
- **retention**: `{avgKnowledge, passRate, needRetraining, trend[], bySop[{sop, retention, quizzed}]}`
- **verificationScript**: `{sop, emp, turns[{who(ai/emp), t, tag?, kind(challenge/coach/advance/verdict)?, confidence?, quality(strong/partial/weak)?, hesitation?}], verdict{knowledge, confidence, readiness(ready/borderline/not‑ready), note}}`
- **verificationCalls**: per employee `{sop, when, dur, knowledge, confidence, readiness, trend[], flags[], summary, follow}`
- **verification**: `{callsToday, readyRate, notReady, avgConfidence, trend[]}`
- **analytics**: `{weeks[], compliance[], completion[], failures[], trainingLift[], byLocation[]}`
- **briefing / stats / insights**: dashboard AI summary, live‑ops stat cards, AI recommendations

Relationships: `org 1—* locations 1—* employees 1—* (tasks, quizRecords, verificationCalls,
conversations, inspections)`; `sops 1—* quiz/training`; `escalations` reference an employee + location.

---

## 8. Screens & views

### 8.1 Desktop dashboard (`index.html`)
Sidebar (groups: Operate / People / Knowledge) + sticky topbar with **⌘K Ask‑the‑AI** command
palette and theme toggle. Views:

- **Dashboard** — AI Operations Briefing (large generated summary + action chips), live‑ops stat
  grid (6 `StatCard`s w/ sparklines + delta pills), Location Health cards, AI Recommendations feed,
  **SOP Knowledge Retention** card (quiz KPIs + flagged‑for‑retraining list).
- **Tasks** — 4‑column kanban; AI‑generated tasks banner; priority dots, source tags.
- **Escalations** — master list (severity‑colored queue) + detail (AI summary, recommended action,
  evidence, approve/reassign/snooze).
- **Quality Inspection** — queue + before/after panes; AI analysis pane overlays **detection boxes**;
  AI checklist (pass/fail), verdict ("Needs Revision"), AI note, send‑back/override.
- **Employees** — searchable/sortable list → profile: AI Performance Score **Ring**, signal
  breakdown bars, **SOP knowledge & retention** panel (quiz score, missed, knowledge, retention
  history, AI recommendation), AI coaching timeline.
- **AI Conversations** — channel filter + transcript view with AI summary + "actions taken".
- **Verification Calls** — KPI strip; call list (readiness + K/C scores); detail = **recording
  player (waveform)**, knowledge/confidence/readiness, AI assessment + flags, improvement chart,
  **annotated transcript** (◆ COACHING / CHALLENGING / ADVANCING badges; per‑answer confidence,
  quality, hesitation), retraining actions.
- **SOP Knowledge Base** — category cards (usage, success %, questions, incidents) → modal detail.
- **Analytics** — AI insight banner, KPI trend heads, line/bar charts, location + workforce
  leaderboards, **SOP knowledge & retention** (retention trend, retention‑by‑SOP, retraining queue).

### 8.2 Employee mobile (`mobile.html`)
Tab bar: **Today / Tasks / [Call] / Train / Me**. Key screens:
- **Today** — greeting, AI briefing card, big "Call the AI Manager", task list, score tiles.
- **Train** — featured video w/ a **two‑step competency gate**: `1 · Quiz → 2 · AI call`.
- **AI Training Quiz** (`quiz.jsx`) — intro ("Before you continue, I'll ask a few quick
  questions…") → questions answered by **tap / type / voice**, graded instantly with AI
  explanation → result (pass/needs‑review, recap, recommendation). On pass → **Continue to AI call**.
- **Voice quiz mode** — orb + waveform + "AI asks / employee says" transcript.
- **AI Verification Call** (`verify.jsx`) — auto‑playing live call: header timer, **live analysis
  strip** (Confidence meter, Answer quality, AI Mode), orb (active when AI speaks), streaming
  transcript with per‑answer confidence/quality/hesitation, adaptive AI (coach weak / advance
  strong), end **verdict** (readiness + scores + "result sent to manager"). Tap advances.
- **Call** — AI voice support; **Photo** — quality‑check result screen.

### 8.3 Manager mobile (`manager-mobile.html`)
Tab bar: **Overview / Alerts / [Ask] / Sites / Team**. Overview shows AI briefing, live‑ops tiles,
"what needs you", a **Knowledge verification** card (ready rate / confidence / retrain + the
not‑ready employee), and location health. Plus **Verification Calls** list + detail
(`VerifyM`/`VCallDetailM`) mirroring desktop, **Escalation detail** (approve/reassign), and an
**Ask‑AI** conversational screen.

---

## 9. Interactions & behavior

- **Routing:** prototype uses local React state (`view` on desktop, `tab` on mobile, plus overlay
  states for quiz/verify/escalation/sop modals). In production use real routes; keep overlays as
  modal routes.
- **Theme:** `data-theme` on `<html>`, persisted to `localStorage` (`amm-mobile-theme` on mobile).
- **⌘K palette:** opens AskAI; suggestions route to views; typing shows an AI answer with action
  buttons.
- **Quiz grading:** choice = exact match to `answer` index; text = keyword match against `accept[]`
  (production: send to LLM for nuanced grading). Pass threshold **≥ 80%**.
- **Verification call playback:** turns reveal on a timer (AI turns ~2.6s, employee ~1.9s); tap to
  skip; confidence = running avg of employee‑turn confidences; AI Mode derived from latest AI turn
  `kind`; verdict after last turn.
- **Quality inspection:** detection boxes are absolutely positioned overlays on the AI pane; verdict
  from pass/total.
- **Motion:** `fade-up` entrances; `orbPulse`/`ampBar` for voice UI; all behind
  `prefers-reduced-motion`. Stat deltas color by direction (with `invert` for "lower is better").
- **Device scaling (showcase pages only):** phones render at 390×844 inside an iOS frame; rows scale
  to fit via a measured `transform: scale` + negative margin (`ScaledRow`). This is prototype
  presentation chrome — **not** part of the real apps.

---

## 10. State & data fetching (production guidance)

- Replace `window.AMM` reads with API calls (React Query/SWR). Suggested endpoints mirror §7 keys.
- Real‑time: dashboard live‑ops, escalations, and verification results should stream
  (WebSocket/SSE). AI briefing + insights are generated server‑side on a schedule and cached.
- Quiz/verification results write back to `quizRecords` / `verificationCalls` and update
  `retention` / `verification` aggregates; failing a verification creates an escalation + manager
  notification (see brief's escalation routing).

---

## 11. Suggested production stack

Frontend: **Next.js + React + TypeScript + Tailwind**, Zustand/React Query for state, Recharts (or
keep the lightweight SVG charts in `ui.jsx`). Backend: **Node/Next API + Python AI services**,
Postgres (Supabase) + Redis + a vector DB for SOP RAG + object storage for media. AI: LLM for
summaries/grading/insights, vision model for inspections, a voice stack (e.g. Vapi/Retell + Deepgram
+ ElevenLabs) for the verification calls. (A fuller system‑design doc was started under `docs/`.)

---

## 12. Files in this bundle

Everything under `source/` is the design reference (copy of the prototype). Start with `share/` to
view, then read `source/desktop/*` and `source/mobile/*` for exact component logic, and
`source/shared/tokens.css` for tokens.

- `source/` — full prototype source (desktop/, mobile/, shared/, the 3 entry HTML files)
- `source/share/` — self‑contained offline builds (open these to view the designs)
- `screenshots/` — rendered reference images: `*-desktop.png` (dashboard, verification calls,
  quality inspection, analytics), `*-employee.png` (today, training gate, quiz feedback/result,
  verification call, verdict, voice help), `*-manager.png` (overview, verification list, call
  detail ready/flagged, escalation, ask‑AI)
- `README.md` — this document
```
```
