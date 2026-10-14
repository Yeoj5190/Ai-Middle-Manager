-- ============================================================================
-- AI MIDDLE MANAGER — Web Push subscriptions
-- ADDITIVE. Stores each worker's per-device push subscription so the server can
-- send OS/lock-screen notifications. The send-push Edge Function reads these with
-- the service role. Run AFTER 0013.
-- ============================================================================

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  endpoint    text not null unique,        -- the browser push endpoint (per device)
  p256dh      text not null,               -- subscription public key
  auth        text not null,               -- subscription auth secret
  created_at  timestamptz not null default now()
);
create index if not exists push_subs_emp_idx on public.push_subscriptions(employee_id);

alter table public.push_subscriptions enable row level security;

-- a worker manages only their own device subscriptions
drop policy if exists worker_push_subs_all on public.push_subscriptions;
create policy worker_push_subs_all on public.push_subscriptions for all to authenticated
  using (employee_id = public.current_employee_id())
  with check (employee_id = public.current_employee_id() and org_id = public.current_employee_org());
