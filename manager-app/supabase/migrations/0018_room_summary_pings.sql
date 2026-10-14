-- ============================================================================
-- AI MIDDLE MANAGER — room turnover summary pings
-- ADDITIVE. Rooms are vacated 10:00 and due before 14:00 (org-local). Instead of
-- per-room pings, send two AGGREGATE pushes a day:
--   • room_start    (10:00) — "N rooms vacated — clean before 2pm"
--   • room_deadline (13:30) — "X rooms left — due before 2pm"
-- A "room turnover" task = a task whose sop_id points to a room-type SOP
-- (sops.room_type_code is not null). Summaries are push-only (acknowledged on
-- send) so they don't show as in-app cards or ring the alarm. Run AFTER 0017.
-- ============================================================================

-- widen the allowed check-in kinds (additive — only adds values)
alter table public.checkins drop constraint if exists checkins_kind_check;
alter table public.checkins add constraint checkins_kind_check
  check (kind in ('daily_checkin','task_reminder','task_checkin','room_start','room_deadline'));

-- deliver_checkin: add aggregate room-summary handling, keep existing per-task copy
create or replace function public.deliver_checkin(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare c public.checkins; v_title text; v_body text; v_task text;
        v_tz text; v_day date; v_remaining int;
begin
  select * into c from public.checkins where id = p_id;
  if not found then return; end if;

  update public.checkins set status = 'sent', sent_at = now() where id = p_id;

  -- ── aggregate room turnover pings (no single task) ───────────────────────
  if c.kind in ('room_start','room_deadline') then
    -- push-only: acknowledge so it never appears as an in-app card / alarm
    update public.checkins set acknowledged_at = now() where id = p_id;
    v_tz := public.checkin_org_tz(c.org_id);
    v_day := (c.fire_at at time zone v_tz)::date;
    select count(*) filter (where t.status <> 'done') into v_remaining
      from public.tasks t
      join public.sops s on s.id = t.sop_id
     where t.assignee_employee_id = c.employee_id
       and t.task_date = v_day
       and s.room_type_code is not null;
    if coalesce(v_remaining, 0) = 0 then
      return; -- nothing left to clean → no nag
    end if;
    if c.kind = 'room_start' then
      v_title := '🧹 Rooms ready to turn over';
      v_body  := v_remaining || ' room(s) vacated — clean before 2pm.';
    else
      v_title := '⏰ Turnover deadline soon';
      v_body  := v_remaining || ' room(s) left — due before 2pm.';
    end if;
    perform net.http_post(
      url := 'https://taneorscbfbvppqkdzxl.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_l9cQZJEGmuhkN-g09rZThg_Jxv5iMVH',
        'Authorization', 'Bearer sb_publishable_l9cQZJEGmuhkN-g09rZThg_Jxv5iMVH'
      ),
      body := jsonb_build_object('employee_id', c.employee_id, 'title', v_title, 'body', v_body, 'url', '/')
    );
    return;
  end if;

  -- ── per-task check-ins (unchanged from 0016) ─────────────────────────────
  if c.task_id is not null then
    insert into public.task_logs (org_id, task_id, employee_id, event, body)
    values (c.org_id, c.task_id, c.employee_id, 'note',
            '[checkin:'||c.kind||'] fired (push attempted)');
  end if;

  v_task := coalesce(c.context->>'task_title', 'your tasks');
  if c.opens_call then
    v_title := '📞 AI Manager wants to check in';
    if c.task_id is not null then
      v_body := 'Tap to call back about "' || v_task || '".';
    else
      v_body := 'Tap to call back for your shift check-in.';
    end if;
  elsif c.kind = 'task_reminder' then
    v_title := 'Task due soon';   v_body := v_task || ' is due soon.';
  else
    v_title := 'Check-in';        v_body := 'You have a new check-in.';
  end if;

  perform net.http_post(
    url := 'https://taneorscbfbvppqkdzxl.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_l9cQZJEGmuhkN-g09rZThg_Jxv5iMVH',
      'Authorization', 'Bearer sb_publishable_l9cQZJEGmuhkN-g09rZThg_Jxv5iMVH'
    ),
    body := jsonb_build_object('employee_id', c.employee_id, 'title', v_title, 'body', v_body, 'url', '/')
  );
end $$;

-- generate today's two room-summary pings for each worker who has room turnovers
create or replace function public.gen_room_summaries()
returns int language plpgsql security definer set search_path = public as $$
declare e record; v_tz text; v_day date; v_start timestamptz; v_dead timestamptz; n int := 0;
begin
  for e in
    select distinct t.org_id, t.assignee_employee_id as emp
      from public.tasks t
      join public.sops s on s.id = t.sop_id
     where s.room_type_code is not null
       and t.assignee_employee_id is not null
       and t.task_date = (now() at time zone public.checkin_org_tz(t.org_id))::date
  loop
    v_tz := public.checkin_org_tz(e.org_id);
    v_day := (now() at time zone v_tz)::date;
    v_start := (v_day + time '10:00') at time zone v_tz;
    v_dead  := (v_day + time '13:30') at time zone v_tz;
    if v_start > now() then
      insert into public.checkins (org_id, employee_id, task_id, kind, fire_at, opens_call, context, dedup_key)
      values (e.org_id, e.emp, null, 'room_start', v_start, false, '{}'::jsonb, 'roomstart:'||e.emp||':'||v_day::text)
      on conflict (dedup_key) do nothing;
      n := n + 1;
    end if;
    if v_dead > now() then
      insert into public.checkins (org_id, employee_id, task_id, kind, fire_at, opens_call, context, dedup_key)
      values (e.org_id, e.emp, null, 'room_deadline', v_dead, false, '{}'::jsonb, 'roomdeadline:'||e.emp||':'||v_day::text)
      on conflict (dedup_key) do nothing;
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;

revoke all on function public.gen_room_summaries() from public, anon, authenticated;
grant execute on function public.gen_room_summaries() to service_role;

-- schedule hourly generation (process_due_checkins, every minute, fires them)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'amm-gen-room-summaries') then
    perform cron.unschedule('amm-gen-room-summaries');
  end if;
  perform cron.schedule('amm-gen-room-summaries', '10 * * * *',
    $job$ select public.gen_room_summaries(); $job$);
end $$;
