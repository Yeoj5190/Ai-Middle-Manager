-- ============================================================================
-- AI MIDDLE MANAGER — Overview (manager home) tables
-- Live-ops tiles, AI briefing, "what needs you" insights, verification summary.
-- In production: briefings + insights are LLM-generated on a schedule and cached;
-- stat_tiles come from analytics aggregation. Seeded here as cached snapshots.
-- Run AFTER 0001/0002.
-- ============================================================================

-- ── live-ops stat tiles ──────────────────────────────────────────────────────
create table if not exists public.stat_tiles (
  id      uuid primary key default gen_random_uuid(),
  org_id  uuid not null references public.orgs(id) on delete cascade,
  key     text not null,
  label   text not null,
  value   text not null,
  sub     text,
  delta   text,
  dir     text check (dir in ('up','down')),
  invert  boolean not null default false,   -- lower-is-better metrics
  spark   int[]  not null default '{}',
  sort    int    not null default 0
);
create index if not exists stat_tiles_org_idx on public.stat_tiles(org_id, sort);

-- ── AI operations briefing (latest cached) ──────────────────────────────────
create table if not exists public.briefings (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  body        text not null,
  stamp       text,
  created_at  timestamptz not null default now()
);
create index if not exists briefings_org_idx on public.briefings(org_id, created_at desc);

-- ── "what needs you" insights / AI recommendations ──────────────────────────
create table if not exists public.insights (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs(id) on delete cascade,
  sev           text not null check (sev in ('crit','warn','good')),
  body          text not null,
  action_label  text,
  sort          int  not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists insights_org_idx on public.insights(org_id, sort);

-- ── knowledge-verification summary (one row per org) ────────────────────────
-- Until the full verification_calls surface is built, the Overview card reads
-- this aggregate + a pointer to the flagged (not-ready) employee.
create table if not exists public.verification_summary (
  org_id               uuid primary key references public.orgs(id) on delete cascade,
  calls_today          int not null default 0,
  ready_rate           int not null default 0,
  not_ready            int not null default 0,
  avg_confidence       int not null default 0,
  not_ready_employee_id text references public.employees(id) on delete set null,
  not_ready_sop        text,
  not_ready_knowledge  int
);

-- ── RLS (org-scoped read) ────────────────────────────────────────────────────
alter table public.stat_tiles           enable row level security;
alter table public.briefings            enable row level security;
alter table public.insights             enable row level security;
alter table public.verification_summary enable row level security;

drop policy if exists stat_tiles_select on public.stat_tiles;
create policy stat_tiles_select on public.stat_tiles
  for select using (org_id = public.current_org_id());

drop policy if exists briefings_select on public.briefings;
create policy briefings_select on public.briefings
  for select using (org_id = public.current_org_id());

drop policy if exists insights_select on public.insights;
create policy insights_select on public.insights
  for select using (org_id = public.current_org_id());

drop policy if exists verification_summary_select on public.verification_summary;
create policy verification_summary_select on public.verification_summary
  for select using (org_id = public.current_org_id());
