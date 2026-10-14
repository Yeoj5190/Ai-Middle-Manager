-- ============================================================================
-- AI MIDDLE MANAGER — Step 2: real VAPI reminder calls (no Edge Functions)
-- The shared fire_reminder() now places a real outbound VAPI call using the
-- synchronous `http` extension (captures the VAPI call id immediately), and a
-- pg_cron poller (process_call_results) writes the transcript/outcome back.
-- VAPI API key is read from Supabase Vault; provider ids live in reminder_settings.
-- Run AFTER 0001–0006.
--
-- POST-MIGRATION CONFIG (run once; NOT committed with the real key):
--   select vault.create_secret('<VAPI_API_KEY>', 'vapi_api_key', 'VAPI API key');
--   update public.reminder_settings
--      set vapi_phone_number_id = '<VAPI_PHONE_NUMBER_ID>',
--          vapi_assistant_id    = '<VAPI_ASSISTANT_ID>'
--    where org_id = '<ORG_ID>';
-- ============================================================================

create extension if not exists http with schema extensions;

alter table public.reminder_settings
  add column if not exists vapi_phone_number_id text,
  add column if not exists vapi_assistant_id   text,
  add column if not exists vapi_base_url        text not null default 'https://api.vapi.ai';

-- ── shared call function: places a REAL VAPI call ───────────────────────────
create or replace function public.fire_reminder(
  p_reminder_id uuid default null,
  p_source      text default 'scheduled',
  p_employee_id text default null,
  p_task_id     text default null,
  p_note        text default null,
  p_created_by  uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  v_org uuid; v_emp text; v_task text; v_note text; v_call uuid;
  v_rem public.reminders; v_emp_row public.employees;
  v_phone text; v_name text; v_first text; v_task_title text;
  v_key text; v_phone_id text; v_assistant text; v_base text;
  v_payload jsonb; v_status int; v_content text;
begin
  if p_reminder_id is not null then
    select * into v_rem from public.reminders where id = p_reminder_id;
    if not found then raise exception 'reminder % not found', p_reminder_id; end if;
    v_org := v_rem.org_id; v_emp := v_rem.employee_id; v_task := v_rem.task_id;
    v_note := coalesce(p_note, v_rem.note);
  else
    select org_id into v_org from public.employees where id = p_employee_id;
    if v_org is null then raise exception 'employee % not found', p_employee_id; end if;
    v_emp := p_employee_id; v_task := p_task_id; v_note := p_note;
  end if;

  select * into v_emp_row from public.employees where id = v_emp;
  v_phone := v_emp_row.phone;
  v_name  := coalesce(v_emp_row.name, 'there');
  if v_task is not null then select title into v_task_title from public.tasks where id = v_task; end if;

  insert into public.call_logs (org_id, reminder_id, employee_id, task_id, source, note, outcome, created_by)
  values (v_org, p_reminder_id, v_emp, v_task, p_source, v_note, 'queued', p_created_by)
  returning id into v_call;

  if p_reminder_id is not null then
    update public.reminders set status = 'calling', last_call_id = v_call where id = p_reminder_id;
  end if;

  if v_phone is null or v_phone = '' then
    update public.call_logs set outcome = 'failed', summary = 'No phone number on file for ' || v_name || '.' where id = v_call;
    if p_reminder_id is not null then update public.reminders set status = 'failed' where id = p_reminder_id; end if;
    return v_call;
  end if;

  select vapi_phone_number_id, vapi_assistant_id, coalesce(vapi_base_url, 'https://api.vapi.ai')
    into v_phone_id, v_assistant, v_base
    from public.reminder_settings where org_id = v_org;
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'vapi_api_key';

  if v_key is null or v_phone_id is null or v_assistant is null then
    update public.call_logs set outcome = 'failed', summary = 'VAPI not configured (key/phone/assistant missing).' where id = v_call;
    if p_reminder_id is not null then update public.reminders set status = 'failed' where id = p_reminder_id; end if;
    return v_call;
  end if;

  v_first := 'Hi ' || split_part(v_name, ' ', 1)
          || ', this is your A I operations manager with a quick reminder. '
          || coalesce(nullif(v_note, ''), 'Please take care of your assigned task' || coalesce(': ' || v_task_title, ''))
          || '. Thanks!';

  v_payload := jsonb_build_object(
    'assistantId', v_assistant,
    'phoneNumberId', v_phone_id,
    'customer', jsonb_build_object('number', v_phone),
    'assistantOverrides', jsonb_build_object(
      'firstMessage', v_first,
      'variableValues', jsonb_build_object(
        'employee_name', v_name,
        'task_title', coalesce(v_task_title, ''),
        'note', coalesce(v_note, '')
      ),
      'metadata', jsonb_build_object('call_log_id', v_call::text, 'source', p_source)
    )
  );

  begin
    perform http_set_curlopt('CURLOPT_TIMEOUT_MS', '12000');
    select status, content into v_status, v_content
      from http(('POST', v_base || '/call',
                 array[http_header('Authorization', 'Bearer ' || v_key)],
                 'application/json', v_payload::text)::http_request);

    if v_status between 200 and 299 then
      update public.call_logs set vapi_call_id = (v_content::jsonb)->>'id', outcome = 'ringing' where id = v_call;
    else
      update public.call_logs set outcome = 'failed', summary = 'VAPI ' || v_status || ': ' || left(v_content, 300) where id = v_call;
      if p_reminder_id is not null then update public.reminders set status = 'failed' where id = p_reminder_id; end if;
    end if;
  exception when others then
    update public.call_logs set outcome = 'failed', summary = 'Call error: ' || left(sqlerrm, 300) where id = v_call;
    if p_reminder_id is not null then update public.reminders set status = 'failed' where id = p_reminder_id; end if;
  end;

  return v_call;
end
$fn$;

-- ── result poller (pg_cron): fetch ended calls, write transcript/outcome ────
create or replace function public.process_call_results()
returns int
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  r record; v_key text; v_status int; v_content text; j jsonb;
  v_reason text; v_outcome text; v_dur int; n int := 0;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'vapi_api_key';
  if v_key is null then return 0; end if;

  for r in
    select id, vapi_call_id, reminder_id from public.call_logs
     where vapi_call_id is not null and ended_at is null and outcome in ('queued', 'ringing')
     order by started_at limit 50
  loop
    begin
      select status, content into v_status, v_content
        from http(('GET', 'https://api.vapi.ai/call/' || r.vapi_call_id,
                   array[http_header('Authorization', 'Bearer ' || v_key)],
                   null, null)::http_request);
      if v_status between 200 and 299 then
        j := v_content::jsonb;
        if (j->>'status') = 'ended' then
          v_reason := coalesce(j->>'endedReason', '');
          v_outcome := case
            when v_reason ilike '%voicemail%' then 'voicemail'
            when v_reason ilike '%did-not-answer%' or v_reason ilike '%no-answer%'
              or v_reason ilike '%customer-busy%' or v_reason ilike '%does-not-exist%' then 'no-answer'
            when v_reason ilike '%error%' or v_reason ilike '%failed%' then 'failed'
            else 'answered' end;
          v_dur := case when (j->>'startedAt') is not null and (j->>'endedAt') is not null
                        then greatest(0, floor(extract(epoch from ((j->>'endedAt')::timestamptz - (j->>'startedAt')::timestamptz))))::int
                        else null end;
          update public.call_logs
             set outcome = v_outcome,
                 transcript = j->>'transcript',
                 summary = coalesce(j #>> '{analysis,summary}', j->>'summary', summary),
                 duration_seconds = v_dur,
                 ended_at = coalesce((j->>'endedAt')::timestamptz, now())
           where id = r.id;
          if r.reminder_id is not null then
            update public.reminders set status = case when v_outcome = 'failed' then 'failed' else 'done' end
             where id = r.reminder_id;
          end if;
          n := n + 1;
        end if;
      end if;
    exception when others then null;  -- transient; retry next tick
    end;
  end loop;
  return n;
end
$fn$;

revoke all on function public.process_call_results() from public, anon, authenticated;
grant execute on function public.process_call_results() to service_role;

-- poll results every minute
do $$
begin
  if exists (select 1 from cron.job where jobname = 'amm-poll-calls') then
    perform cron.unschedule('amm-poll-calls');
  end if;
  perform cron.schedule('amm-poll-calls', '* * * * *', $job$ select public.process_call_results(); $job$);
end $$;
