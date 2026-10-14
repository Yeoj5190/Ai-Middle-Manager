-- ============================================================================
-- AI MIDDLE MANAGER — AI brain, piece 1: structured post-call extraction
-- Additive. Stores the AI's structured READING of a call transcript (what the
-- employee *reported* — a claim, NOT verified truth) + the raw transcript for
-- audit. The real/verified task state stays in `tasks` and is never written
-- from a phone claim. Extraction logic lives in the app (src/lib/ai/*, OpenAI
-- Structured Outputs); this table is its store. Run AFTER 0001–0007.
-- ============================================================================
create table if not exists public.call_extractions (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references public.orgs(id) on delete cascade,
  call_log_id          uuid not null references public.call_logs(id) on delete cascade,
  transcript           text,                         -- exact input fed to the model (audit)
  reported_task_status text check (reported_task_status in ('done','in_progress','blocked','not_started')),
  acknowledged         boolean,
  needs_help           boolean,
  blocker              text,
  follow_up_needed     boolean,
  notes                text,
  model                text,                         -- which model produced this
  raw_output           jsonb,                        -- full structured result (audit/extensible)
  source               text not null default 'manual_test' check (source in ('manual_test','auto')),
  created_by           uuid references public.profiles(id) on delete set null,
  created_at           timestamptz not null default now()
);
create index if not exists call_extractions_call_idx on public.call_extractions(call_log_id, created_at desc);
create index if not exists call_extractions_org_idx  on public.call_extractions(org_id);

alter table public.call_extractions enable row level security;

drop policy if exists call_extractions_select on public.call_extractions;
create policy call_extractions_select on public.call_extractions
  for select to authenticated using (org_id = public.current_org_id());

drop policy if exists call_extractions_insert on public.call_extractions;
create policy call_extractions_insert on public.call_extractions
  for insert to authenticated with check (org_id = public.current_org_id());
