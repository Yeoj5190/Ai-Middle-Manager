-- ============================================================================
-- AI MIDDLE MANAGER — fire Web Push when a check-in is delivered
-- ADDITIVE. deliver_checkin (from 0010) now also calls the send-push Edge
-- Function via pg_net so a fired check-in becomes a real OS notification.
-- No-op if the worker has no subscribed device. Run AFTER 0010 + send-push deploy.
-- ============================================================================

create extension if not exists pg_net;

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
  if c.kind = 'task_reminder' then
    v_title := 'Task due soon';   v_body := v_task || ' is due soon.';
  elsif c.kind = 'task_checkin' then
    v_title := 'Check-in';        v_body := 'Did you finish ' || v_task || '?';
  else
    v_title := 'Shift check-in';  v_body := 'Time for your shift check-in with the AI Manager.';
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
