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
