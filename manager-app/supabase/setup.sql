-- ============================================================================
-- AI MIDDLE MANAGER — full setup (paste into the Supabase SQL editor)
-- Generated from migrations/0001..0008
-- ============================================================================

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

-- ============================================================================
-- AI MIDDLE MANAGER — Row-Level Security + signup wiring
-- Every row carries org_id; users only see their own org (README §5 multi-tenant).
-- Run AFTER 0001_schema.sql.
-- ============================================================================

-- Helper: the org_id of the currently-authenticated user. SECURITY DEFINER so it
-- can read profiles without recursing into profiles' own RLS policy.
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid();
$$;

-- ── enable RLS ───────────────────────────────────────────────────────────────
alter table public.orgs            enable row level security;
alter table public.profiles        enable row level security;
alter table public.locations       enable row level security;
alter table public.employees       enable row level security;
alter table public.quiz_records    enable row level security;
alter table public.employee_events enable row level security;

-- ── profiles: read own + same-org rows; update only your own row ────────────
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or org_id = public.current_org_id());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ── orgs: read your own org ──────────────────────────────────────────────────
drop policy if exists orgs_select on public.orgs;
create policy orgs_select on public.orgs
  for select using (id = public.current_org_id());

-- ── org-scoped read for the operational tables ──────────────────────────────
drop policy if exists locations_select on public.locations;
create policy locations_select on public.locations
  for select using (org_id = public.current_org_id());

drop policy if exists employees_select on public.employees;
create policy employees_select on public.employees
  for select using (org_id = public.current_org_id());
-- NOTE: to scope a Supervisor to a single location, AND this with a check against
-- the user's assigned location(s). Left org-level for this slice (README §5).

drop policy if exists quiz_records_select on public.quiz_records;
create policy quiz_records_select on public.quiz_records
  for select using (org_id = public.current_org_id());

-- ── employee_events: read org rows; managers may insert (actions) in their org ─
drop policy if exists employee_events_select on public.employee_events;
create policy employee_events_select on public.employee_events
  for select using (org_id = public.current_org_id());

drop policy if exists employee_events_insert on public.employee_events;
create policy employee_events_insert on public.employee_events
  for insert with check (
    org_id = public.current_org_id()
    and (actor_id is null or actor_id = auth.uid())
  );

-- ── auto-create a profile on signup, attached to the demo org ───────────────
-- Lets a new signup land in the seeded demo org as an ops_manager immediately.
-- For real onboarding, replace with an invite flow that sets org_id + role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  demo_org uuid := '00000000-0000-0000-0000-000000000001';
begin
  insert into public.profiles (id, org_id, full_name, role)
  values (
    new.id,
    demo_org,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'ops_manager'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

-- ============================================================================
-- AI MIDDLE MANAGER — rich task detail
-- One JSONB document per task holds the operational investigation view:
-- timeline, AI reasoning, checklist, media, inspection checks, activity, insights.
-- (Kept as a document rather than 7 join tables — it's read/written as a unit.)
-- Run AFTER 0001–0004.
-- ============================================================================

alter table public.tasks
  add column if not exists detail jsonb not null default '{}'::jsonb;

-- managers may update a task in their org (status changes, appending to the
-- audit trail / timeline inside detail).
drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks
  for update using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- ============================================================================
-- AI MIDDLE MANAGER — AI reminder calls (Step 1: schema + scheduler, VAPI stubbed)
-- ADDITIVE ONLY. Adds employees.phone (nullable) + 3 new tables + functions +
-- a pg_cron job. Touches no existing table data/structure destructively.
-- Run AFTER 0001–0005.
-- ============================================================================

-- ── additive column: employee phone (E.164, nullable) ───────────────────────
alter table public.employees
  add column if not exists phone text;

-- ── per-org call settings (quiet hours) ─────────────────────────────────────
create table if not exists public.reminder_settings (
  org_id       uuid primary key references public.orgs(id) on delete cascade,
  enabled      boolean not null default true,
  quiet_start  time not null default '21:00',     -- calls pause at/after this local time
  quiet_end    time not null default '08:00',     -- …and resume at this local time
  timezone     text not null default 'Australia/Sydney',
  updated_at   timestamptz not null default now()
);

-- ── reminders (the scheduled intent; status drives fire-exactly-once) ───────
create table if not exists public.reminders (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs(id) on delete cascade,
  employee_id   text not null references public.employees(id) on delete cascade,
  task_id       text references public.tasks(id) on delete set null,
  scheduled_for timestamptz not null,
  note          text,
  recurrence    text,                              -- null = one-shot (v1). reserved for later.
  source        text not null default 'scheduled' check (source in ('scheduled','manual')),
  status        text not null default 'pending'
                check (status in ('pending','calling','done','failed','skipped','canceled')),
  attempts      int not null default 0,
  claimed_at    timestamptz,
  last_call_id  uuid,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists reminders_due_idx on public.reminders(status, scheduled_for);
create index if not exists reminders_org_idx on public.reminders(org_id);

-- ── call_logs (every attempt, both sources, with outcome) ───────────────────
create table if not exists public.call_logs (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.orgs(id) on delete cascade,
  reminder_id      uuid references public.reminders(id) on delete set null,
  employee_id      text references public.employees(id) on delete set null,
  task_id          text references public.tasks(id) on delete set null,
  source           text not null check (source in ('scheduled','manual')),
  note             text,
  outcome          text not null default 'queued'
                   check (outcome in ('queued','ringing','answered','no-answer','voicemail','failed','stub')),
  vapi_call_id     text,
  transcript       text,
  summary          text,
  duration_seconds int,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now()
);
create index if not exists call_logs_org_idx on public.call_logs(org_id, created_at desc);
create index if not exists call_logs_reminder_idx on public.call_logs(reminder_id);

-- ── RLS (org-scoped, authenticated) ─────────────────────────────────────────
alter table public.reminder_settings enable row level security;
alter table public.reminders         enable row level security;
alter table public.call_logs         enable row level security;

drop policy if exists reminder_settings_select on public.reminder_settings;
create policy reminder_settings_select on public.reminder_settings
  for select to authenticated using (org_id = public.current_org_id());
drop policy if exists reminder_settings_write on public.reminder_settings;
create policy reminder_settings_write on public.reminder_settings
  for update to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

drop policy if exists reminders_select on public.reminders;
create policy reminders_select on public.reminders
  for select to authenticated using (org_id = public.current_org_id());
drop policy if exists reminders_insert on public.reminders;
create policy reminders_insert on public.reminders
  for insert to authenticated with check (org_id = public.current_org_id());
drop policy if exists reminders_update on public.reminders;
create policy reminders_update on public.reminders
  for update to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- call_logs: read-only to managers; rows are written by SECURITY DEFINER funcs.
drop policy if exists call_logs_select on public.call_logs;
create policy call_logs_select on public.call_logs
  for select to authenticated using (org_id = public.current_org_id());

-- ── quiet-hours check (true = OK to call right now) ─────────────────────────
create or replace function public.within_call_window(p_org uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare s public.reminder_settings; localt time;
begin
  select * into s from public.reminder_settings where org_id = p_org;
  if not found then return true; end if;          -- no settings → always allowed
  if not s.enabled then return false; end if;      -- calls disabled
  localt := (now() at time zone s.timezone)::time;
  if s.quiet_start = s.quiet_end then
    return true;                                    -- empty quiet window
  elsif s.quiet_start < s.quiet_end then
    return not (localt >= s.quiet_start and localt < s.quiet_end);
  else                                              -- overnight wrap (e.g. 21:00–08:00)
    return not (localt >= s.quiet_start or localt < s.quiet_end);
  end if;
end $$;

-- ── SHARED call function — both triggers route through this ─────────────────
-- STUB (Step 1): records a call_logs row with outcome 'stub' and resolves the
-- reminder. Step 2 replaces the stub body with a real VAPI call + leaves status
-- 'calling' until the webhook reports the outcome. Returns the call_logs id.
create or replace function public.fire_reminder(
  p_reminder_id uuid default null,
  p_source      text default 'scheduled',
  p_employee_id text default null,
  p_task_id     text default null,
  p_note        text default null,
  p_created_by  uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid; v_emp text; v_task text; v_note text; v_call uuid;
  v_rem public.reminders;
begin
  if p_reminder_id is not null then
    select * into v_rem from public.reminders where id = p_reminder_id;
    if not found then raise exception 'reminder % not found', p_reminder_id; end if;
    v_org := v_rem.org_id; v_emp := v_rem.employee_id; v_task := v_rem.task_id;
    v_note := coalesce(p_note, v_rem.note);
  else
    select org_id into v_org from public.employees where id = p_employee_id;
    if v_org is null then raise exception 'employee % not found', p_employee_id; end if;
    v_emp := p_employee_id; v_task := p_task_id; v_note := p_note;
  end if;

  insert into public.call_logs (org_id, reminder_id, employee_id, task_id, source, note, outcome, summary, created_by)
  values (v_org, p_reminder_id, v_emp, v_task, p_source, v_note,
          'stub', 'Stub call (VAPI not wired yet). Context recorded; no phone call placed.', p_created_by)
  returning id into v_call;

  -- Step 2 will issue the VAPI call here (net.http_post) and keep status 'calling'.
  if p_reminder_id is not null then
    update public.reminders
       set status = 'done', last_call_id = v_call
     where id = p_reminder_id;
  end if;

  return v_call;
end $$;

-- ── manual entry point (authz wrapper → same shared function) ───────────────
-- The manager "Call now" button calls THIS; it enforces org ownership, then
-- delegates to fire_reminder so manual + scheduled share one call path.
create or replace function public.call_now(
  p_employee_id text,
  p_task_id     text default null,
  p_note        text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_call uuid;
begin
  if not exists (
    select 1 from public.employees
    where id = p_employee_id and org_id = public.current_org_id()
  ) then
    raise exception 'not authorized for employee %', p_employee_id;
  end if;
  v_call := public.fire_reminder(null, 'manual', p_employee_id, p_task_id, p_note, auth.uid());
  return v_call;
end $$;

-- ── scheduler — claims due reminders EXACTLY ONCE, then fires each ──────────
-- The conditional UPDATE ... RETURNING is the fire-once guarantee: a row can
-- only transition pending→calling once; overlapping ticks can't double-claim
-- (FOR UPDATE SKIP LOCKED). Quiet-hours reminders stay pending until the window
-- reopens.
create or replace function public.process_due_reminders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare r record; n int := 0;
begin
  for r in
    update public.reminders rem
       set status = 'calling', claimed_at = now(), attempts = rem.attempts + 1
     where rem.id in (
       select s.id from public.reminders s
        where s.status = 'pending'
          and s.scheduled_for <= now()
          and public.within_call_window(s.org_id)
        order by s.scheduled_for
        for update skip locked
        limit 100
     )
    returning rem.id
  loop
    perform public.fire_reminder(r.id, 'scheduled');
    n := n + 1;
  end loop;
  return n;
end $$;

-- lock down the internal functions; expose only the intended callers
revoke all on function public.fire_reminder(uuid, text, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.process_due_reminders() from public, anon, authenticated;
revoke all on function public.within_call_window(uuid) from public, anon, authenticated;
grant execute on function public.process_due_reminders() to service_role;
grant execute on function public.call_now(text, text, text) to authenticated, service_role;

-- ── schedule the heartbeat (pg_cron, every minute) ──────────────────────────
create extension if not exists pg_cron;
do $$
begin
  if exists (select 1 from cron.job where jobname = 'amm-process-due-reminders') then
    perform cron.unschedule('amm-process-due-reminders');
  end if;
  perform cron.schedule('amm-process-due-reminders', '* * * * *',
                        $job$ select public.process_due_reminders(); $job$);
end $$;

-- ============================================================================
-- AI MIDDLE MANAGER — Step 2: real VAPI reminder calls (no Edge Functions)
-- The shared fire_reminder() now places a real outbound VAPI call using the
-- synchronous `http` extension (captures the VAPI call id immediately), and a
-- pg_cron poller (process_call_results) writes the transcript/outcome back.
-- VAPI API key is read from Supabase Vault; provider ids live in reminder_settings.
-- Run AFTER 0001–0006.
--
-- POST-MIGRATION CONFIG (run once; NOT committed with the real key):
--   select vault.create_secret('<VAPI_API_KEY>', 'vapi_api_key', 'VAPI API key');
--   update public.reminder_settings
--      set vapi_phone_number_id = '<VAPI_PHONE_NUMBER_ID>',
--          vapi_assistant_id    = '<VAPI_ASSISTANT_ID>'
--    where org_id = '<ORG_ID>';
-- ============================================================================

create extension if not exists http with schema extensions;

alter table public.reminder_settings
  add column if not exists vapi_phone_number_id text,
  add column if not exists vapi_assistant_id   text,
  add column if not exists vapi_base_url        text not null default 'https://api.vapi.ai';

-- ── shared call function: places a REAL VAPI call ───────────────────────────
create or replace function public.fire_reminder(
  p_reminder_id uuid default null,
  p_source      text default 'scheduled',
  p_employee_id text default null,
  p_task_id     text default null,
  p_note        text default null,
  p_created_by  uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  v_org uuid; v_emp text; v_task text; v_note text; v_call uuid;
  v_rem public.reminders; v_emp_row public.employees;
  v_phone text; v_name text; v_first text; v_task_title text;
  v_key text; v_phone_id text; v_assistant text; v_base text;
  v_payload jsonb; v_status int; v_content text;
begin
  if p_reminder_id is not null then
    select * into v_rem from public.reminders where id = p_reminder_id;
    if not found then raise exception 'reminder % not found', p_reminder_id; end if;
    v_org := v_rem.org_id; v_emp := v_rem.employee_id; v_task := v_rem.task_id;
    v_note := coalesce(p_note, v_rem.note);
  else
    select org_id into v_org from public.employees where id = p_employee_id;
    if v_org is null then raise exception 'employee % not found', p_employee_id; end if;
    v_emp := p_employee_id; v_task := p_task_id; v_note := p_note;
  end if;

  select * into v_emp_row from public.employees where id = v_emp;
  v_phone := v_emp_row.phone;
  v_name  := coalesce(v_emp_row.name, 'there');
  if v_task is not null then select title into v_task_title from public.tasks where id = v_task; end if;

  insert into public.call_logs (org_id, reminder_id, employee_id, task_id, source, note, outcome, created_by)
  values (v_org, p_reminder_id, v_emp, v_task, p_source, v_note, 'queued', p_created_by)
  returning id into v_call;

  if p_reminder_id is not null then
    update public.reminders set status = 'calling', last_call_id = v_call where id = p_reminder_id;
  end if;

  if v_phone is null or v_phone = '' then
    update public.call_logs set outcome = 'failed', summary = 'No phone number on file for ' || v_name || '.' where id = v_call;
    if p_reminder_id is not null then update public.reminders set status = 'failed' where id = p_reminder_id; end if;
    return v_call;
  end if;

  select vapi_phone_number_id, vapi_assistant_id, coalesce(vapi_base_url, 'https://api.vapi.ai')
    into v_phone_id, v_assistant, v_base
    from public.reminder_settings where org_id = v_org;
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'vapi_api_key';

  if v_key is null or v_phone_id is null or v_assistant is null then
    update public.call_logs set outcome = 'failed', summary = 'VAPI not configured (key/phone/assistant missing).' where id = v_call;
    if p_reminder_id is not null then update public.reminders set status = 'failed' where id = p_reminder_id; end if;
    return v_call;
  end if;

  v_first := 'Hi ' || split_part(v_name, ' ', 1)
          || ', this is your A I operations manager with a quick reminder. '
          || coalesce(nullif(v_note, ''), 'Please take care of your assigned task' || coalesce(': ' || v_task_title, ''))
          || '. Thanks!';

  v_payload := jsonb_build_object(
    'assistantId', v_assistant,
    'phoneNumberId', v_phone_id,
    'customer', jsonb_build_object('number', v_phone),
    'assistantOverrides', jsonb_build_object(
      'firstMessage', v_first,
      'variableValues', jsonb_build_object(
        'employee_name', v_name,
        'task_title', coalesce(v_task_title, ''),
        'note', coalesce(v_note, '')
      ),
      'metadata', jsonb_build_object('call_log_id', v_call::text, 'source', p_source)
    )
  );

  begin
    perform http_set_curlopt('CURLOPT_TIMEOUT_MS', '12000');
    select status, content into v_status, v_content
      from http(('POST', v_base || '/call',
                 array[http_header('Authorization', 'Bearer ' || v_key)],
                 'application/json', v_payload::text)::http_request);

    if v_status between 200 and 299 then
      update public.call_logs set vapi_call_id = (v_content::jsonb)->>'id', outcome = 'ringing' where id = v_call;
    else
      update public.call_logs set outcome = 'failed', summary = 'VAPI ' || v_status || ': ' || left(v_content, 300) where id = v_call;
      if p_reminder_id is not null then update public.reminders set status = 'failed' where id = p_reminder_id; end if;
    end if;
  exception when others then
    update public.call_logs set outcome = 'failed', summary = 'Call error: ' || left(sqlerrm, 300) where id = v_call;
    if p_reminder_id is not null then update public.reminders set status = 'failed' where id = p_reminder_id; end if;
  end;

  return v_call;
end
$fn$;

-- ── result poller (pg_cron): fetch ended calls, write transcript/outcome ────
create or replace function public.process_call_results()
returns int
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  r record; v_key text; v_status int; v_content text; j jsonb;
  v_reason text; v_outcome text; v_dur int; n int := 0;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'vapi_api_key';
  if v_key is null then return 0; end if;

  for r in
    select id, vapi_call_id, reminder_id from public.call_logs
     where vapi_call_id is not null and ended_at is null and outcome in ('queued', 'ringing')
     order by started_at limit 50
  loop
    begin
      select status, content into v_status, v_content
        from http(('GET', 'https://api.vapi.ai/call/' || r.vapi_call_id,
                   array[http_header('Authorization', 'Bearer ' || v_key)],
                   null, null)::http_request);
      if v_status between 200 and 299 then
        j := v_content::jsonb;
        if (j->>'status') = 'ended' then
          v_reason := coalesce(j->>'endedReason', '');
          v_outcome := case
            when v_reason ilike '%voicemail%' then 'voicemail'
            when v_reason ilike '%did-not-answer%' or v_reason ilike '%no-answer%'
              or v_reason ilike '%customer-busy%' or v_reason ilike '%does-not-exist%' then 'no-answer'
            when v_reason ilike '%error%' or v_reason ilike '%failed%' then 'failed'
            else 'answered' end;
          v_dur := case when (j->>'startedAt') is not null and (j->>'endedAt') is not null
                        then greatest(0, floor(extract(epoch from ((j->>'endedAt')::timestamptz - (j->>'startedAt')::timestamptz))))::int
                        else null end;
          update public.call_logs
             set outcome = v_outcome,
                 transcript = j->>'transcript',
                 summary = coalesce(j #>> '{analysis,summary}', j->>'summary', summary),
                 duration_seconds = v_dur,
                 ended_at = coalesce((j->>'endedAt')::timestamptz, now())
           where id = r.id;
          if r.reminder_id is not null then
            update public.reminders set status = case when v_outcome = 'failed' then 'failed' else 'done' end
             where id = r.reminder_id;
          end if;
          n := n + 1;
        end if;
      end if;
    exception when others then null;  -- transient; retry next tick
    end;
  end loop;
  return n;
end
$fn$;

revoke all on function public.process_call_results() from public, anon, authenticated;
grant execute on function public.process_call_results() to service_role;

-- poll results every minute
do $$
begin
  if exists (select 1 from cron.job where jobname = 'amm-poll-calls') then
    perform cron.unschedule('amm-poll-calls');
  end if;
  perform cron.schedule('amm-poll-calls', '* * * * *', $job$ select public.process_call_results(); $job$);
end $$;

-- ============================================================================
-- AI MIDDLE MANAGER — AI brain, piece 1: structured post-call extraction
-- Additive. Stores the AI's structured READING of a call transcript (what the
-- employee *reported* — a claim, NOT verified truth) + the raw transcript for
-- audit. The real/verified task state stays in `tasks` and is never written
-- from a phone claim. Extraction logic lives in the app (src/lib/ai/*, OpenAI
-- Structured Outputs); this table is its store. Run AFTER 0001–0007.
-- ============================================================================
create table if not exists public.call_extractions (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references public.orgs(id) on delete cascade,
  call_log_id          uuid not null references public.call_logs(id) on delete cascade,
  transcript           text,                         -- exact input fed to the model (audit)
  reported_task_status text check (reported_task_status in ('done','in_progress','blocked','not_started')),
  acknowledged         boolean,
  needs_help           boolean,
  blocker              text,
  follow_up_needed     boolean,
  notes                text,
  model                text,                         -- which model produced this
  raw_output           jsonb,                        -- full structured result (audit/extensible)
  source               text not null default 'manual_test' check (source in ('manual_test','auto')),
  created_by           uuid references public.profiles(id) on delete set null,
  created_at           timestamptz not null default now()
);
create index if not exists call_extractions_call_idx on public.call_extractions(call_log_id, created_at desc);
create index if not exists call_extractions_org_idx  on public.call_extractions(org_id);

alter table public.call_extractions enable row level security;

drop policy if exists call_extractions_select on public.call_extractions;
create policy call_extractions_select on public.call_extractions
  for select to authenticated using (org_id = public.current_org_id());

drop policy if exists call_extractions_insert on public.call_extractions;
create policy call_extractions_insert on public.call_extractions
  for insert to authenticated with check (org_id = public.current_org_id());

