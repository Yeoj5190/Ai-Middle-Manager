-- ============================================================================
-- AI MIDDLE MANAGER — daily task generation (recurring templates → per-day tasks)
-- ADDITIVE. Gives tasks a real day (task_date) and a way to materialise each
-- day's routine work from templates. Generated tasks carry due_at, so the
-- check-in engine (0010) schedules their reminders automatically. Run AFTER 0010.
-- ============================================================================

-- ── tasks get a day + a link back to the template that produced them ────────
alter table public.tasks
  add column if not exists task_date   date,
  add column if not exists template_id text;
create index if not exists tasks_assignee_date_idx on public.tasks(assignee_employee_id, task_date);

-- ── recurring task templates (per org / optional location) ──────────────────
create table if not exists public.task_templates (
  id                   text primary key,
  org_id               uuid not null references public.orgs(id) on delete cascade,
  location_id          text references public.locations(id) on delete set null,
  title                text not null,
  assignee_employee_id text references public.employees(id) on delete set null,
  sop_id               text references public.sops(id) on delete set null,
  priority             text not null default 'med' check (priority in ('high','med','low')),
  due_time             time,                                 -- local time-of-day (null = no due)
  days_of_week         int[] not null default '{}',          -- empty = every day; else 0=Sun..6=Sat
  active               boolean not null default true,
  created_at           timestamptz not null default now()
);
create index if not exists task_templates_org_idx on public.task_templates(org_id);

alter table public.task_templates enable row level security;
drop policy if exists task_templates_select on public.task_templates;
create policy task_templates_select on public.task_templates
  for select to authenticated using (org_id = public.current_org_id());

-- ── generate one org's tasks for a given day from active templates ──────────
-- Idempotent: task id is deterministic ('R-<template>-<YYYYMMDD>') so re-running
-- a day never duplicates. due_at is computed in the org timezone, stored UTC.
create or replace function public.gen_daily_tasks(p_org uuid, p_date date)
returns int language plpgsql security definer set search_path = public as $$
declare tpl record; v_tz text; v_dow int; v_id text; v_due timestamptz; n int := 0;
begin
  v_tz  := coalesce((select timezone from public.reminder_settings where org_id = p_org), 'UTC');
  v_dow := extract(dow from p_date)::int;
  for tpl in select * from public.task_templates where org_id = p_org and active loop
    if array_length(tpl.days_of_week, 1) is not null and not (v_dow = any(tpl.days_of_week)) then
      continue;                                              -- not scheduled this weekday
    end if;
    v_id  := 'R-'||tpl.id||'-'||to_char(p_date,'YYYYMMDD');
    v_due := case when tpl.due_time is not null
                  then (p_date + tpl.due_time) at time zone v_tz else null end;
    insert into public.tasks (id, org_id, location_id, title, assignee_employee_id,
              priority, status, due_label, source, sop_id, due_at, task_date, template_id)
    values (v_id, p_org, tpl.location_id, tpl.title, tpl.assignee_employee_id,
            tpl.priority, 'todo',
            case when tpl.due_time is not null then to_char(tpl.due_time,'HH24:MI') else null end,
            'recurring', tpl.sop_id, v_due, p_date, tpl.id)
    on conflict (id) do nothing;
    n := n + 1;
  end loop;
  return n;
end $$;

-- ── wrapper: generate every org's tasks for its own local "today" ───────────
create or replace function public.gen_daily_tasks_all()
returns int language plpgsql security definer set search_path = public as $$
declare o record; v_tz text; v_date date; total int := 0;
begin
  for o in select id from public.orgs loop
    v_tz   := coalesce((select timezone from public.reminder_settings where org_id = o.id), 'UTC');
    v_date := (now() at time zone v_tz)::date;
    total  := total + public.gen_daily_tasks(o.id, v_date);
  end loop;
  return total;
end $$;

revoke all on function public.gen_daily_tasks(uuid, date) from public, anon, authenticated;
revoke all on function public.gen_daily_tasks_all()      from public, anon, authenticated;
grant execute on function public.gen_daily_tasks_all()   to service_role;

-- ── schedule: materialise the day's tasks hourly (idempotent) ───────────────
create extension if not exists pg_cron;
do $$
begin
  if exists (select 1 from cron.job where jobname = 'amm-gen-daily-tasks') then
    perform cron.unschedule('amm-gen-daily-tasks');
  end if;
  perform cron.schedule('amm-gen-daily-tasks', '10 * * * *',
    $job$ select public.gen_daily_tasks_all(); $job$);
end $$;
