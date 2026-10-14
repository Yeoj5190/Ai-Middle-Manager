-- ============================================================================
-- AI MIDDLE MANAGER — schema (employee-management slice)
-- Maps the prototype's window.AMM data model (README §7) to Postgres tables.
-- Run this in the Supabase SQL editor (or via `supabase db push`), then 0002.
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ── orgs ────────────────────────────────────────────────────────────────────
create table if not exists public.orgs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ── profiles (1:1 with auth.users) ──────────────────────────────────────────
-- A manager/owner/supervisor login. role drives permissions (README §5).
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid not null references public.orgs(id) on delete cascade,
  full_name   text not null default 'Manager',
  role        text not null default 'ops_manager'
              check (role in ('owner','ops_manager','supervisor','trainer','admin')),
  created_at  timestamptz not null default now()
);
create index if not exists profiles_org_idx on public.profiles(org_id);

-- ── locations ───────────────────────────────────────────────────────────────
create table if not exists public.locations (
  id          text primary key,            -- slug ('balan', 'gran', …)
  org_id      uuid not null references public.orgs(id) on delete cascade,
  name        text not null,
  area        text,
  staff       int  not null default 0,
  "open"      int  not null default 0,     -- open tasks
  quality     int  not null default 0,
  compliance  int  not null default 0,
  issues      int  not null default 0,
  trend       int  not null default 0
);
create index if not exists locations_org_idx on public.locations(org_id);

-- ── employees ───────────────────────────────────────────────────────────────
-- id is a global slug for clean URLs (/employees/bianca). For strict multi-tenant
-- isolation switch to a uuid surrogate PK + unique (org_id, slug).
create table if not exists public.employees (
  id           text primary key,
  org_id       uuid not null references public.orgs(id) on delete cascade,
  location_id  text references public.locations(id) on delete set null,
  name         text not null,
  role         text,
  status       text not null default 'off-shift' check (status in ('on-shift','off-shift')),
  score        int  not null default 0,      -- AI Performance Score
  tasks        int  not null default 0,
  tasks_wk     int  not null default 0,
  quality      int  not null default 0,
  sop          int  not null default 0,
  reliability  int  not null default 0,
  training     int  not null default 0,
  escalations  int  not null default 0,
  tenure       text,
  shift        text,
  channel      text,
  delta        int  not null default 0,
  initials     text not null default '?'
);
create index if not exists employees_org_idx on public.employees(org_id);
create index if not exists employees_loc_idx on public.employees(location_id);

-- ── quiz_records (latest AI Training Quiz result per employee) ───────────────
create table if not exists public.quiz_records (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.orgs(id) on delete cascade,
  employee_id  text not null references public.employees(id) on delete cascade,
  sop          text,
  sop_id       text,
  score        int,
  total        int,
  knowledge    int,
  status       text check (status in ('pass','needs-review')),
  taken_at     text,                          -- human label e.g. '2d ago'
  missed       text[] not null default '{}',
  trend        int[]  not null default '{}',
  attempts     int    not null default 1,
  rec          text,
  created_at   timestamptz not null default now()
);
create index if not exists quiz_records_emp_idx on public.quiz_records(employee_id);

-- ── employee_events (AI coaching timeline + persisted manager actions) ──────
-- Read by the profile's "AI coaching history". Manager actions (send refresher,
-- schedule re-quiz, message via AI) insert rows here so they show up live.
create table if not exists public.employee_events (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.orgs(id) on delete cascade,
  employee_id  text not null references public.employees(id) on delete cascade,
  actor_id     uuid references public.profiles(id) on delete set null,  -- null = AI
  kind         text not null default 'coaching'
               check (kind in ('coaching','action')),
  action_type  text check (action_type in ('refresher','requiz','message')),
  channel      text,                          -- 'Voice','WhatsApp','Telegram','SMS','System'
  good         boolean not null default true,
  body         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists employee_events_emp_idx on public.employee_events(employee_id, created_at desc);
