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
