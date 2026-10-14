-- ============================================================================
-- AI MIDDLE MANAGER — proactive check-in SCHEDULING engine (employee app)
-- "When to notify" only. Delivery is STUBBED behind deliver_checkin().
--
-- ADDITIVE + ISOLATED FROM VAPI. This deliberately does NOT use the `reminders`
-- table or its `amm-process-due-reminders` cron (that pipeline places Vapi phone
-- calls). Check-ins live in their own `checkins` table with their own cron, so
-- manager-app's Vapi behaviour is completely untouched.
-- Run AFTER 0001–0009.
-- ============================================================================

-- ── A. policy — extend per-org reminder_settings (additive columns) ─────────
alter table public.reminder_settings
  add column if not exists reminder_lead_minutes int     not null default 20,
  add column if not exists checkin_delay_minutes  int     not null default 30,
  add column if not exists daily_checkin_time     time,                  -- null ⇒ default 08:00 (TODO: shift start)
  add column if not exists daily_checkin_enabled  boolean not null default true,
  add column if not exists task_reminder_enabled  boolean not null default true,
  add column if not exists task_checkin_enabled   boolean not null default true;

-- ── B. tasks need a real due timestamp to schedule from (was free-text only) ─
alter table public.tasks
  add column if not exists due_at timestamptz;

-- ── C. the check-in schedule (separate from reminders / Vapi) ───────────────
create table if not exists public.checkins (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.orgs(id) on delete cascade,
  employee_id  text not null references public.employees(id) on delete cascade,
  task_id      text references public.tasks(id) on delete cascade,   -- null for daily check-in
  kind         text not null check (kind in ('daily_checkin','task_reminder','task_checkin')),
  fire_at      timestamptz not null,                                 -- stored UTC
  opens_call   boolean not null default true,                        -- task_reminder = false (nudge)
  status       text not null default 'pending'
               check (status in ('pending','sent','skipped','cancelled')),
  context      jsonb not null default '{}'::jsonb,
  dedup_key    text not null,                                        -- idempotency
  sent_at      timestamptz,
  created_at   timestamptz not null default now()
);
create unique index if not exists checkins_dedup_key on public.checkins(dedup_key);
create index if not exists checkins_due_idx on public.checkins(status, fire_at);
create index if not exists checkins_org_idx on public.checkins(org_id);

alter table public.checkins enable row level security;

-- managers (authenticated) read their org's check-ins
drop policy if exists checkins_select on public.checkins;
create policy checkins_select on public.checkins
  for select to authenticated using (org_id = public.current_org_id());

-- TEST-ONLY anon read for the employee-app demo org (matches other test_anon_*)
drop policy if exists test_anon_checkins_sel on public.checkins;
create policy test_anon_checkins_sel on public.checkins
  for select to anon using (org_id = '00000000-0000-0000-0000-000000000001');
-- writes happen only via the SECURITY DEFINER functions below, never direct client inserts.

-- ── helper: per-org timezone (lives on reminder_settings) ───────────────────
create or replace function public.checkin_org_tz(p_org uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select timezone from public.reminder_settings where org_id = p_org), 'UTC');
$$;

-- ── D. generation ───────────────────────────────────────────────────────────
-- For one task: (re)build its task_reminder (due − lead, nudge) and task_checkin
-- (due + delay, opens a call). Idempotent via dedup_key; only touches pending rows.
-- Cancels pending rows if the task becomes unschedulable (no due/assignee, or done).
create or replace function public.gen_task_checkins(p_task_id text)
returns void language plpgsql security definer set search_path = public as $$
declare t public.tasks; s public.reminder_settings; v_lead int; v_delay int;
begin
  select * into t from public.tasks where id = p_task_id;
  if not found then return; end if;

  if t.due_at is null or t.assignee_employee_id is null or t.status = 'done' then
    update public.checkins set status = 'cancelled'
     where task_id = p_task_id and status = 'pending';
    return;
  end if;

  select * into s from public.reminder_settings where org_id = t.org_id;
  v_lead  := coalesce(s.reminder_lead_minutes, 20);
  v_delay := coalesce(s.checkin_delay_minutes, 30);

  if coalesce(s.task_reminder_enabled, true) then
    insert into public.checkins (org_id, employee_id, task_id, kind, fire_at, opens_call, context, dedup_key)
    values (t.org_id, t.assignee_employee_id, t.id, 'task_reminder',
            t.due_at - make_interval(mins => v_lead), false,
            jsonb_build_object('task_title', t.title), 'task:'||t.id||':reminder')
    on conflict (dedup_key) do update
      set fire_at = excluded.fire_at, employee_id = excluded.employee_id, context = excluded.context
      where checkins.status = 'pending';
  end if;

  if coalesce(s.task_checkin_enabled, true) then
    insert into public.checkins (org_id, employee_id, task_id, kind, fire_at, opens_call, context, dedup_key)
    values (t.org_id, t.assignee_employee_id, t.id, 'task_checkin',
            t.due_at + make_interval(mins => v_delay), true,
            jsonb_build_object('task_title', t.title), 'task:'||t.id||':checkin')
    on conflict (dedup_key) do update
      set fire_at = excluded.fire_at, employee_id = excluded.employee_id, context = excluded.context
      where checkins.status = 'pending';
  end if;
end $$;

-- recompute a task's check-ins whenever its due time / assignee / status changes
create or replace function public.tasks_checkins_trg()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.gen_task_checkins(new.id);
  return new;
end $$;

drop trigger if exists tasks_checkins_aiu on public.tasks;
create trigger tasks_checkins_aiu
  after insert or update of due_at, assignee_employee_id, status on public.tasks
  for each row execute function public.tasks_checkins_trg();

-- once-daily check-in per on-shift worker at the org's daily_checkin_time (local → UTC)
create or replace function public.gen_daily_checkins()
returns int language plpgsql security definer set search_path = public as $$
declare e record; s public.reminder_settings; v_tz text; v_time time; v_local_date date; v_fire timestamptz; n int := 0;
begin
  for e in select em.* from public.employees em where em.status = 'on-shift' loop
    select * into s from public.reminder_settings where org_id = e.org_id;
    if s.org_id is not null and not coalesce(s.daily_checkin_enabled, true) then continue; end if;
    v_tz := public.checkin_org_tz(e.org_id);
    v_time := coalesce(s.daily_checkin_time, time '08:00');
    v_local_date := (now() at time zone v_tz)::date;
    v_fire := (v_local_date + v_time) at time zone v_tz;   -- local wall time → UTC
    insert into public.checkins (org_id, employee_id, task_id, kind, fire_at, opens_call, context, dedup_key)
    values (e.org_id, e.id, null, 'daily_checkin', v_fire, true, '{}'::jsonb,
            'daily:'||e.id||':'||v_local_date::text)
    on conflict (dedup_key) do nothing;
    n := n + 1;
  end loop;
  return n;
end $$;

-- ── E. dispatch ─────────────────────────────────────────────────────────────
-- DELIVERY SEAM. STUB for now: mark sent + breadcrumb. Real push/call plugs in here.
create or replace function public.deliver_checkin(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare c public.checkins;
begin
  select * into c from public.checkins where id = p_id;
  if not found then return; end if;

  -- ░░░░░ replace this block with the real notification/call sender later ░░░░░
  update public.checkins set status = 'sent', sent_at = now() where id = p_id;
  if c.task_id is not null then
    insert into public.task_logs (org_id, task_id, employee_id, event, body)
    values (c.org_id, c.task_id, c.employee_id, 'note',
            '[checkin:'||c.kind||'] fired (stub delivery)');
  end if;
end $$;

-- claim due pending check-ins exactly once; re-check relevance; deliver or skip.
create or replace function public.process_due_checkins()
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0; v_done boolean; v_exists boolean;
begin
  for r in
    select ck.* from public.checkins ck
     where ck.status = 'pending' and ck.fire_at <= now()
     order by ck.fire_at
     for update skip locked
     limit 200
  loop
    v_done := false;
    if r.task_id is not null then
      select (status = 'done') into v_done from public.tasks where id = r.task_id;
      if not found then
        v_done := true;                       -- task gone → no longer relevant
      elsif not v_done then
        select exists(
          select 1 from public.task_logs
           where task_id = r.task_id and event = 'completed'
        ) into v_exists;
        v_done := v_exists;                    -- worker logged it done → skip
      end if;
    end if;

    if v_done then
      update public.checkins set status = 'skipped' where id = r.id;
    else
      perform public.deliver_checkin(r.id);    -- sets status = 'sent'
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;

-- ── F. lock down + schedule (pg_cron; separate jobs from the Vapi pipeline) ──
revoke all on function public.gen_task_checkins(text)   from public, anon, authenticated;
revoke all on function public.gen_daily_checkins()      from public, anon, authenticated;
revoke all on function public.deliver_checkin(uuid)     from public, anon, authenticated;
revoke all on function public.process_due_checkins()    from public, anon, authenticated;
revoke all on function public.checkin_org_tz(uuid)      from public, anon, authenticated;
grant execute on function public.process_due_checkins() to service_role;
grant execute on function public.gen_daily_checkins()   to service_role;

create extension if not exists pg_cron;
do $$
begin
  if exists (select 1 from cron.job where jobname = 'amm-process-due-checkins') then
    perform cron.unschedule('amm-process-due-checkins');
  end if;
  perform cron.schedule('amm-process-due-checkins', '* * * * *',
    $job$ select public.process_due_checkins(); $job$);

  if exists (select 1 from cron.job where jobname = 'amm-gen-daily-checkins') then
    perform cron.unschedule('amm-gen-daily-checkins');
  end if;
  perform cron.schedule('amm-gen-daily-checkins', '5 * * * *',
    $job$ select public.gen_daily_checkins(); $job$);
end $$;
