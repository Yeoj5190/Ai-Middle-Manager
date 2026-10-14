# AI Middle Manager

An AI that supervises frontline staff (motel housekeeping, to start). One manager can oversee
many workers through an AI "operations manager": workers get a daily task list, **call the AI by
voice** during their shift, and run **photo quality checks**; the AI proactively checks in, logs
issues, and surfaces what needs a human. Two surfaces share one Supabase project: the **worker app**
(`employee-app/`) and a **manager dashboard** (`manager-app/`).

---

## NON-NEGOTIABLE RULES (read first)

1. **ADDITIVE ONLY.** Never remove, rename, or restructure an existing feature/table/column without
   asking first. Prefer new files, new additive migrations, new columns.
2. **REPORTED ≠ VERIFIED.** Store what a worker *claims* on a call as a claim. Never let a claim
   overwrite verified truth. Verification is a **separate photo/vision step** (`analyze-photo`).
3. **APPROVE BEFORE EXECUTE.** The AI *proposes*; nothing that mutates data runs without explicit
   human approval. Before touching the shared DB, propose the migration and wait for go-ahead. Log
   every action (`task_logs`, `employee_events`, `call_logs`).
4. **GROUNDING.** Every fact/number the AI states must come from a real data query (e.g. the
   `get_my_tasks` tool, a vision result) — never invented. The vision check must describe what's
   actually in the photo and fail off-topic/irrelevant images.
5. **SECRETS IN ENV ONLY.** Keys (`OPENAI_API_KEY`, VAPID private, service role) belong in Function
   Secrets / env vars, never the client. ⚠️ *Current test-debt:* some keys are embedded in edge
   functions as a fallback and need rotating + moving to Function Secrets.

---

## TECH STACK (actual)

- **employee-app/** — React 19 + **Vite 6** + TypeScript + **Tailwind 3.4**, `@supabase/supabase-js`.
  Mobile-first PWA. **Voice = OpenAI Realtime API over WebRTC** (NOT Vapi). **Vision = OpenAI
  `gpt-5.4-mini`**. Web Push (service worker + VAPID). Deployed on **Netlify**.
- **manager-app/** — **Next.js 15** + React 19, `@supabase/ssr`, `openai` (server-side). Manager
  dashboard. **Outbound reminder calls use Vapi** (the `reminders` queue + `pg_cron`).
- **Supabase** (project `taneorscbfbvppqkdzxl`) — Postgres + RLS + **Edge Functions (Deno)** +
  `pg_cron` + `pg_net`. Migrations live in `manager-app/supabase/migrations/` (`0001`–`0015`).
- **Edge functions:** `realtime-token` (mints OpenAI ephemeral token), `analyze-photo` (vision QC),
  `send-push` (web push).

## ARCHITECTURE — the "brain"

The **call/photo layer writes data IN** (worker claims, photos scored into `quality_checks`,
issues into `tasks`). The **manager side reads and reasons over it** and escalates to a human when
needed. Voice audio flows **phone → OpenAI directly** (server only mints a token); the edge
functions are thin and stateless — **the browser is the orchestrator** (reads/writes Postgres under
RLS, runs tools, saves results). A **deterministic scheduling engine** (no AI) decides *when* to
check in; delivery is in-app notifications + Web Push (manager outbound = Vapi).

## CURRENT STATE (real vs stub)

**employee-app — built & verified this session:**
- **Auth** ✅ email+password; `employees.auth_user_id` links login→worker; authenticated `worker_*`
  RLS. Test logins: `michael@ / aisha@ / jamal@ / lena@resthaus.com.au`, pwd `Cleaner1234!` (test only).
  (`michael@` is the renamed `bianca` worker — employee id is still `bianca` internally.)
- **Today** ✅ per-day tasks from recurring `task_templates` (hourly cron), AI briefing, tap-to-complete,
  day navigator (history), push opt-in.
- **Call** ✅ OpenAI Realtime voice + live transcript, **half-duplex mic-gating** (no echo/self-cutoff),
  proactive greeting, tools `get_my_tasks` + `report_issue`; **in-call camera → general photo QC**.
- **Quality check** ✅ photo → `gpt-5.4-mini` vision, **describe-then-compare**, SOP checklist or
  general area inspection; fails off-topic photos.
- **Proactive check-ins** ✅ scheduling engine (`checkins` + cron) → in-app notifications + **Web Push**.
- ⚠️ *Test-debt:* `test_anon_*` RLS policies still present (drop when locking down); keys embedded in
  edge functions; QC photo image not yet persisted (only the scored result is).

**manager-app — pre-existing, mostly built:**
- **Dashboard on Supabase** ✅ (overview, tasks, employees, escalations, verification, calls, locations).
- **Reminders** 🟡 scheduled + manual reminder calls wired via `pg_cron` → Vapi; Vapi calls test/stub.
- **Post-call extraction** ✅ (`call_extractions`).

**Key tables:** `orgs, profiles(managers), employees, locations, tasks(+due_at,task_date,sop_id,
template_id), task_templates, sops(checklist jsonb), task_logs, quality_checks, briefings, checkins,
push_subscriptions, reminders/reminder_settings, call_logs/call_extractions, verification_calls/turns,
escalations`.

## CONVENTIONS

- **Inspect-and-plan before building.** For shared-DB changes, propose the migration + wait for approval.
- **Read-before-write, stub-before-wire** (e.g. `deliver_checkin()` was a stub seam before push).
- **One feature per session.** Keep diffs focused; match surrounding code style.
- **Additive numbered migrations** in `manager-app/supabase/migrations/`; deploy edge fns via the
  Supabase MCP; keep repo copies in sync.
- **Commit before big changes.** (Repo is not git-initialized yet.)
- **Deploy employee-app:** `npm run build` in `employee-app/` → publish `dist/` to Netlify
  (`celadon-zuccutto-2bddab.netlify.app`). DB/edge/AI changes go live instantly (no frontend redeploy).

## ROADMAP / NEXT

- Rotate keys → real Function Secrets; drop `test_anon_*` and tighten to true per-worker RLS.
- Persist QC photos to Supabase Storage so managers can review them.
- Manager-side template/task editor; real Vapi outbound; "company brain" memory; training flows.
