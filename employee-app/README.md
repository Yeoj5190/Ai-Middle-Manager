# AMM — Employee App

Frontline worker surface of the AI Middle Manager platform. Mobile-first React +
Vite + TypeScript + Tailwind. Shares the **same Supabase project** as `../manager-app`.

## Screens
- **Today** — greeting, AI briefing, today's tasks, AI score, "Call the AI Manager".
- **Call** — live OpenAI Realtime voice call (WebRTC): timer, waveform, live transcript.
- **Quality check** — _stubbed_ (deferred): photo → vision SOP scoring.

## Run
```bash
npm install
npm run dev          # http://localhost:5174
```

`.env.local` holds **only public values** (Supabase URL + anon key). There is **no
OpenAI key in this app** — the secret lives only in the `realtime-token` Edge Function.

## Auth (current state)
**No staff sign-in yet.** We hardcode the demo employee (`VITE_DEMO_EMPLOYEE_ID=bianca`)
so we can test functionality against real data. The DB has **test-only anon RLS
policies** (migration `0009`, scoped to the demo org) that make this possible —
they get dropped when real sign-in lands.

## Voice path (OpenAI Realtime)
1. Browser → `realtime-token` Edge Function → short-lived ephemeral token.
2. Browser opens WebRTC **directly to OpenAI** with that token.
3. Live transcript comes off the Realtime data channel.

Audio never flows through our server; the secret key never reaches the client.

### Deploy the Edge Function
```bash
cd ../manager-app
supabase functions deploy realtime-token
supabase secrets set OPENAI_API_KEY=sk-...      # plus optional REALTIME_MODEL / REALTIME_VOICE
```

## Database
Migration `supabase/migrations/0009_employee_app.sql` (in `../manager-app/supabase`)
adds `sops`, `task_logs`, `quality_checks`, a per-employee briefing column, and
`tasks.sop_id`. Seed with `supabase/seed_employee_app.sql`.
