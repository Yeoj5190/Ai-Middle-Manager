-- ============================================================================
-- AI MIDDLE MANAGER — in-app check-in delivery (acknowledgement)
-- ADDITIVE. Lets the employee app surface a fired check-in as a notification and
-- record that the worker acted on it. Real push/SMS stays in deliver_checkin()
-- (0010) as the external seam; this is the in-app channel. Run AFTER 0010.
-- ============================================================================

alter table public.checkins add column if not exists acknowledged_at timestamptz;
create index if not exists checkins_emp_ack_idx
  on public.checkins(employee_id, acknowledged_at, fire_at);

-- TEST-ONLY anon update so the no-auth employee app can acknowledge check-ins in
-- the demo org. Drop with the other test_anon_* policies when staff sign-in lands.
drop policy if exists test_anon_checkins_upd on public.checkins;
create policy test_anon_checkins_upd on public.checkins
  for update to anon
  using (org_id = '00000000-0000-0000-0000-000000000001')
  with check (org_id = '00000000-0000-0000-0000-000000000001');
