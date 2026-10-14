-- ============================================================================
-- AI MIDDLE MANAGER — operational surfaces: escalations, tasks, verification calls
-- Destinations the Overview cards drill into. Run AFTER 0001–0003.
-- ============================================================================

-- ── escalations ──────────────────────────────────────────────────────────────
create table if not exists public.escalations (
  id                 text primary key,         -- 'E-318'
  org_id             uuid not null references public.orgs(id) on delete cascade,
  location_id        text references public.locations(id) on delete set null,
  sev                text not null check (sev in ('critical','high','med')),
  title              text not null,
  when_label         text,
  summary            text,
  action             text,
  evidence           text,
  owner_employee_id  text references public.employees(id) on delete set null,
  status             text not null default 'open'
                     check (status in ('open','approved','reassigned','snoozed')),
  created_at         timestamptz not null default now()
);
create index if not exists escalations_org_idx on public.escalations(org_id);
create index if not exists escalations_loc_idx on public.escalations(location_id);

-- ── tasks ────────────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id                   text primary key,        -- 'T-4821'
  org_id               uuid not null references public.orgs(id) on delete cascade,
  location_id          text references public.locations(id) on delete set null,
  title                text not null,
  assignee_employee_id text references public.employees(id) on delete set null,
  priority             text not null default 'med' check (priority in ('high','med','low')),
  status               text not null default 'todo'
                       check (status in ('todo','in-progress','review','overdue','done')),
  due_label            text,
  source               text
);
create index if not exists tasks_org_idx on public.tasks(org_id);
create index if not exists tasks_loc_idx on public.tasks(location_id);

-- ── verification calls + transcript ──────────────────────────────────────────
create table if not exists public.verification_calls (
  id           text primary key,                -- one per employee in this demo
  org_id       uuid not null references public.orgs(id) on delete cascade,
  employee_id  text references public.employees(id) on delete set null,
  sop          text,
  sop_id       text,
  when_label   text,
  dur          text,
  knowledge    int,
  confidence   int,
  readiness    text check (readiness in ('ready','borderline','not-ready')),
  trend        int[]  not null default '{}',
  follow       int    not null default 0,
  flags        text[] not null default '{}',
  summary      text
);
create index if not exists verification_calls_org_idx on public.verification_calls(org_id);

create table if not exists public.verification_turns (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  call_id     text not null references public.verification_calls(id) on delete cascade,
  ord         int  not null,
  who         text not null check (who in ('ai','emp')),
  body        text not null,
  tag         text,
  kind        text check (kind in ('challenge','coach','advance','verdict')),
  confidence  numeric,
  quality     text check (quality in ('strong','partial','weak')),
  hesitation  boolean not null default false
);
create index if not exists verification_turns_call_idx on public.verification_turns(call_id, ord);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.escalations        enable row level security;
alter table public.tasks              enable row level security;
alter table public.verification_calls enable row level security;
alter table public.verification_turns enable row level security;

drop policy if exists escalations_select on public.escalations;
create policy escalations_select on public.escalations
  for select using (org_id = public.current_org_id());

-- managers may update escalation status (approve / reassign / snooze) in their org
drop policy if exists escalations_update on public.escalations;
create policy escalations_update on public.escalations
  for update using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
  for select using (org_id = public.current_org_id());

drop policy if exists verification_calls_select on public.verification_calls;
create policy verification_calls_select on public.verification_calls
  for select using (org_id = public.current_org_id());

drop policy if exists verification_turns_select on public.verification_turns;
create policy verification_turns_select on public.verification_turns
  for select using (org_id = public.current_org_id());
