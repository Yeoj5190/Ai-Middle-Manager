-- ============================================================================
-- Employee-app demo seed (idempotent). Run AFTER 0009_employee_app.sql.
-- Adds: one SOP with a checklist, a per-employee briefing for Bianca,
-- and links Bianca's tasks to that SOP. Safe to re-run.
-- ============================================================================
do $$
declare demo_org constant uuid := '00000000-0000-0000-0000-000000000001';
begin
  -- room-turnover SOP + checklist (drives AI context + future photo QC)
  insert into public.sops (id, org_id, title, category, checklist)
  values (
    'sop-room-turnover', demo_org, 'Room Turnover', 'Housekeeping',
    '[
      {"key":"bed","label":"Bed made, linens square, no creases","critical":true},
      {"key":"bath","label":"Bathroom sanitised, no water spots","critical":true},
      {"key":"amenities","label":"Amenities restocked (towels, soap, coffee)","critical":false},
      {"key":"bins","label":"All bins emptied and relined","critical":false},
      {"key":"floor","label":"Floors vacuumed / mopped to edges","critical":false}
    ]'::jsonb
  )
  on conflict (id) do update
    set title = excluded.title, checklist = excluded.checklist, category = excluded.category;

  -- per-employee briefing for Bianca (latest wins via created_at)
  insert into public.briefings (org_id, employee_id, body, stamp)
  values (
    demo_org, 'bianca',
    'Morning, Bianca. You have 2 tasks today. Room 14 needs a re-centre on the blanket — quick fix. The pool chemical log is due by 17:00. Tap Call the AI Manager any time.',
    'Today · 06:00'
  );

  -- link Bianca's tasks to the room-turnover SOP
  update public.tasks
     set sop_id = 'sop-room-turnover'
   where assignee_employee_id = 'bianca' and org_id = demo_org;
end $$;
