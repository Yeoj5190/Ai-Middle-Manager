# AI Middle Manager — Manager App

The first **functional** slice of the manager surface: **employee management**
(read + actions), built from the design prototype. Next.js (App Router) +
TypeScript + Supabase (Postgres + Auth + RLS).

## What's here

Six manager surfaces, all reading through one data layer (`src/lib/data.ts`):

- **Overview** — AI operations briefing, live-ops stat tiles (sparklines + deltas),
  "what needs you" insights, knowledge-verification card, location-health grid.
  Every card drills into the surface it summarizes.
- **Escalations** — severity-ranked queue + detail (AI summary, recommended
  action, evidence) with **approve / reassign / snooze** (persists status).
- **Tasks** — kanban board → click a card for the **task investigation view**
  (slide-out drawer via intercepting routes + full page at `/tasks/[id]`):
  overview, AI reasoning, brief (SOP/training/equipment/checklist), media &
  verification (AI vs SOP checks), employee activity, audit-trail timeline, AI
  insights, and manager actions (reassign/escalate/override/note/AI follow-up/
  retraining/verification call) that append to the timeline.
- **Employees** — searchable, sortable list → profile (AI Performance Score ring,
  performance-signal bars, SOP knowledge & retention, AI coaching timeline) +
  manager actions (*Message via AI*, *Send refresher*, *Schedule re-quiz*), each
  persisting an `employee_events` row that appears immediately in the timeline.
- **Verification Calls** — KPI strip + call list → detail (scores, readiness,
  recording player, improvement chart, **annotated transcript** with
  coaching/challenging/advancing badges, retraining actions).
- **Location detail** — per-site health, stats, open escalations, and team.
- **Analytics** — KPI heads, location + workforce leaderboards, verification summary.

**Auth + multi-tenancy** — Supabase Auth; every table is row-level-security
scoped to the signed-in user's org.

## Run it

```bash
cd manager-app
npm install
npm run dev          # http://localhost:3000  → /employees
```

Out of the box it runs in **dev-fallback mode**: data comes from
`src/data/seed.json`, auth is bypassed, and manager actions persist in memory
for the session. A "dev data" badge shows in the header. Good for seeing the UI
immediately.

## Connect Supabase (real Postgres + auth + RLS)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the **SQL editor**, paste and run **`supabase/setup.sql`** (the whole file —
   it bundles all migrations: schema + RLS + Overview tables). Individual
   migrations are in `supabase/migrations/` if you prefer running them in order.
3. Copy `.env.example` → `.env.local` and fill in **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only, used by the seed script)
4. Seed the demo data: `node scripts/seed.mjs`
5. `npm run dev`, open `/login`, **create an account** (a manager profile is
   auto-created in the demo org via a signup trigger), and sign in.

## Layout

```
supabase/migrations/   schema (0001) + RLS & signup trigger (0002)
src/data/seed.json     demo dataset — single source of truth (fallback + seed)
scripts/seed.mjs       loads seed.json into Supabase (service role)
src/lib/
  env.ts               decides Supabase vs dev-fallback
  types.ts             domain types (mirror the tables)
  data.ts              server data access (Supabase OR seed)
  actions.ts           server actions for manager actions
  supabase/            browser + server clients
src/components/        Shell, ui primitives, employee components
src/app/
  login/               sign-in / sign-up
  employees/           list (page) + [id] (profile)
```

## How this maps to the prototype

`window.AMM` reads → `src/lib/data.ts` functions. The desktop `employees.jsx`
components (`EmployeeList`, `EmployeeProfile`, `KnowledgeRetention`) are ported
to typed React Server Components; the only client components are the interactive
bits (search/sort, action buttons, login).

## Next steps

- Location-level scoping for the Supervisor role (commented in `0002_rls.sql`).
- Wire the real side-effects behind the manager actions (`src/lib/actions.ts`
  TODO): SOP refresher delivery, re-quiz scheduling, AI message dispatch.
- Add the remaining manager surfaces (Overview, Escalations, Verification Calls)
  alongside this one.
```
