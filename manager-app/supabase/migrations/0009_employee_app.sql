-- ============================================================================
-- AI MIDDLE MANAGER — employee app (frontline housekeeping surface)
-- Adds the tables the worker app needs on top of the existing shared model:
--   sops · task_logs · quality_checks, a per-employee briefing, and a tasks.sop_id link.
-- Plus a clearly-marked TEST-ONLY anon access block so the app can hit real data
-- before staff sign-in exists. Run AFTER 0001–0008.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── sops: a checklist-bearing Standard Operating Procedure ───────────────────
-- checklist drives both the AI call context and (later) the photo quality check.
create table if not exists public.sops (
  id          text primary key,                     -- slug e.g. 'sop-room-turnover'
  org_id      uuid not null references public.orgs(id) on delete cascade,
  title       text not null,
  category    text,
  checklist   jsonb not null default '[]'::jsonb,    -- [{ "key","label","critical" }]
  created_at  timestamptz not null default now()
);
create index if not exists sops_org_idx on public.sops(org_id);

-- link a task to the SOP its quality check scores against (nullable: not all tasks have one)
alter table public.tasks
  add column if not exists sop_id text references public.sops(id) on delete set null;

-- ── per-employee briefing ────────────────────────────────────────────────────
-- briefings already exists at org level (manager Overview). Add an optional
-- employee_id so each worker's Today screen gets their own AI briefing.
alter table public.briefings
  add column if not exists employee_id text references public.employees(id) on delete cascade;
create index if not exists briefings_emp_idx on public.briefings(employee_id, created_at desc);

-- ── task_logs: append-only employee activity trail ───────────────────────────
-- The worker-side audit trail (the manager's richer view lives in tasks.detail).
create table if not exists public.task_logs (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  task_id     text not null references public.tasks(id) on delete cascade,
  employee_id text references public.employees(id) on delete set null,
  event       text not null default 'note'
              check (event in ('started','paused','resumed','completed','note','call')),
  body        text,
  created_at  timestamptz not null default now()
);
create index if not exists task_logs_task_idx on public.task_logs(task_id, created_at desc);

-- ── quality_checks: photo-based SOP scoring (feature STUBBED; schema defined now) ─
create table if not exists public.quality_checks (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  task_id     text not null references public.tasks(id) on delete cascade,
  employee_id text references public.employees(id) on delete set null,
  sop_id      text references public.sops(id) on delete set null,
  image_path  text,                                  -- Supabase Storage object path
  overall     text check (overall in ('pass','fail','partial')),
  score       int,
  results     jsonb not null default '[]'::jsonb,    -- [{ "key","label","pass","reason" }]
  created_at  timestamptz not null default now()
);
create index if not exists quality_checks_task_idx on public.quality_checks(task_id, created_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.sops           enable row level security;
alter table public.task_logs      enable row level security;
alter table public.quality_checks enable row level security;

-- Authenticated manager (org-scoped) reads — consistent with 0002/0004.
drop policy if exists sops_select on public.sops;
create policy sops_select on public.sops
  for select using (org_id = public.current_org_id());

drop policy if exists task_logs_select on public.task_logs;
create policy task_logs_select on public.task_logs
  for select using (org_id = public.current_org_id());

drop policy if exists quality_checks_select on public.quality_checks;
create policy quality_checks_select on public.quality_checks
  for select using (org_id = public.current_org_id());

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ TEST-ONLY anon access for the employee app — NO STAFF AUTH YET.            ║
-- ║ Scoped to the demo org. This is a throwaway: DROP THE WHOLE BLOCK BELOW    ║
-- ║ the moment real staff sign-in lands (see 0010_employee_auth, future).      ║
-- ║ Roll back with: drop policy test_anon_*; (names all prefixed test_anon_).  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- demo org id: 00000000-0000-0000-0000-000000000001

drop policy if exists test_anon_employees on public.employees;
create policy test_anon_employees on public.employees
  for select to anon using (org_id = '00000000-0000-0000-0000-000000000001');

drop policy if exists test_anon_tasks on public.tasks;
create policy test_anon_tasks on public.tasks
  for select to anon using (org_id = '00000000-0000-0000-0000-000000000001');

drop policy if exists test_anon_sops on public.sops;
create policy test_anon_sops on public.sops
  for select to anon using (org_id = '00000000-0000-0000-0000-000000000001');

drop policy if exists test_anon_briefings on public.briefings;
create policy test_anon_briefings on public.briefings
  for select to anon using (org_id = '00000000-0000-0000-0000-000000000001');

drop policy if exists test_anon_task_logs_sel on public.task_logs;
create policy test_anon_task_logs_sel on public.task_logs
  for select to anon using (org_id = '00000000-0000-0000-0000-000000000001');

-- writes the test app needs: append a task_log, flip a task's status.
drop policy if exists test_anon_task_logs_ins on public.task_logs;
create policy test_anon_task_logs_ins on public.task_logs
  for insert to anon with check (org_id = '00000000-0000-0000-0000-000000000001');

drop policy if exists test_anon_tasks_upd on public.tasks;
create policy test_anon_tasks_upd on public.tasks
  for update to anon using (org_id = '00000000-0000-0000-0000-000000000001')
  with check (org_id = '00000000-0000-0000-0000-000000000001');
