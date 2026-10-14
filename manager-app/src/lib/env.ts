// Central place to read env + decide whether Supabase is wired up.
// When the public Supabase vars are absent we run in "dev-fallback" mode:
// data comes from src/data/seed.json and auth is bypassed. This lets the app
// run/render before you provision a project, then switch to real Postgres +
// auth + RLS the moment you fill in .env.local.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const DEMO_ORG_ID =
  process.env.NEXT_PUBLIC_DEMO_ORG_ID ?? "00000000-0000-0000-0000-000000000001";

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// ── DEV auto-login ───────────────────────────────────────────────────────────
// When on, the middleware silently signs in as the demo manager so you skip the
// login screen during development. Server-only (never sent to the browser).
// Set AMM_DEV_AUTOLOGIN=false in .env.local to restore the normal login flow.
export const AUTO_LOGIN = (process.env.AMM_DEV_AUTOLOGIN ?? "") === "true";
export const AUTO_LOGIN_EMAIL = process.env.AMM_DEV_EMAIL ?? "";
export const AUTO_LOGIN_PASSWORD = process.env.AMM_DEV_PASSWORD ?? "";
