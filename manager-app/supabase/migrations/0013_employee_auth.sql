-- ============================================================================
-- AI MIDDLE MANAGER — employee app sign-in (link auth users to employees)
-- ADDITIVE. Adds employees.auth_user_id, identity helpers, and authenticated
-- WORKER RLS policies scoped to the worker's own org. The existing manager
-- policies (current_org_id via profiles) and the test_anon_* policies are left
-- in place; this just adds the authenticated-worker path. Run AFTER 0009–0012.
-- (When ready to lock down: drop the test_anon_* policies.)
-- ============================================================================

alter table public.employees
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
create unique index if not exists employees_auth_user_idx
  on public.employees(auth_user_id) where auth_user_id is not null;

create or replace function public.current_employee_id()
returns text language sql stable security definer set search_path = public as $$
  select id from public.employees where auth_user_id = auth.uid() limit 1;
$$;
create or replace function public.current_employee_org()
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from public.employees where auth_user_id = auth.uid() limit 1;
$$;

drop policy if exists worker_employees_sel on public.employees;
create policy worker_employees_sel on public.employees for select to authenticated
  using (org_id = public.current_employee_org());

drop policy if exists worker_sops_sel on public.sops;
create policy worker_sops_sel on public.sops for select to authenticated
  using (org_id = public.current_employee_org());

drop policy if exists worker_briefings_sel on public.briefings;
create policy worker_briefings_sel on public.briefings for select to authenticated
  using (org_id = public.current_employee_org());

drop policy if exists worker_tasks_all on public.tasks;
create policy worker_tasks_all on public.tasks for all to authenticated
  using (org_id = public.current_employee_org())
  with check (org_id = public.current_employee_org());

drop policy if exists worker_task_logs_all on public.task_logs;
create policy worker_task_logs_all on public.task_logs for all to authenticated
  using (org_id = public.current_employee_org())
  with check (org_id = public.current_employee_org());

drop policy if exists worker_quality_checks_all on public.quality_checks;
create policy worker_quality_checks_all on public.quality_checks for all to authenticated
  using (org_id = public.current_employee_org())
  with check (org_id = public.current_employee_org());

drop policy if exists worker_checkins_all on public.checkins;
create policy worker_checkins_all on public.checkins for all to authenticated
  using (org_id = public.current_employee_org())
  with check (org_id = public.current_employee_org());
