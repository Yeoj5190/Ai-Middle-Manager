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
