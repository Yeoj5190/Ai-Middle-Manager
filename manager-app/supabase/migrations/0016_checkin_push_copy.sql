-- ============================================================================
-- AI MIDDLE MANAGER — call-style push copy for check-ins
-- ADDITIVE. Redefines deliver_checkin (from 0015) so check-ins where the AI
-- wants to talk (opens_call = true: task_checkin, daily_checkin) push as a
-- "tap to call back" notification. Plain due-soon nudges (task_reminder,
-- opens_call = false) keep their existing copy. No schema/data changes.
-- Run AFTER 0015.
-- ============================================================================

create or replace function public.deliver_checkin(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare c public.checkins; v_title text; v_body text; v_task text;
begin
  select * into c from public.checkins where id = p_id;
  if not found then return; end if;

  update public.checkins set status = 'sent', sent_at = now() where id = p_id;

  if c.task_id is not null then
    insert into public.task_logs (org_id, task_id, employee_id, event, body)
    values (c.org_id, c.task_id, c.employee_id, 'note',
            '[checkin:'||c.kind||'] fired (push attempted)');
  end if;

  v_task := coalesce(c.context->>'task_title', 'your tasks');
  if c.opens_call then
    -- the AI wants to talk → frame it like an incoming call
    v_title := '📞 AI Manager wants to check in';
    if c.task_id is not null then
      v_body := 'Tap to call back about "' || v_task || '".';
    else
      v_body := 'Tap to call back for your shift check-in.';
    end if;
  elsif c.kind = 'task_reminder' then
    v_title := 'Task due soon';   v_body := v_task || ' is due soon.';
  else
    -- safety net for any future non-call kind
    v_title := 'Check-in';        v_body := 'You have a new check-in.';
  end if;

  -- async push; the apikey here is the public anon key (send-push has verify_jwt off)
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
