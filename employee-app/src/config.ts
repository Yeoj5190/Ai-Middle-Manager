// Central env + the hardcoded "who am I" for this no-auth test build.
// When real staff sign-in lands, DEMO_EMPLOYEE_ID gets replaced by the session.

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
export const DEMO_ORG_ID =
  import.meta.env.VITE_DEMO_ORG_ID ?? "00000000-0000-0000-0000-000000000001";
export const DEMO_EMPLOYEE_ID = import.meta.env.VITE_DEMO_EMPLOYEE_ID ?? "bianca";
// the demo org's timezone — "today" is computed in this zone so it matches the
// task_date the DB generator writes (org-local day).
export const DEMO_TZ = import.meta.env.VITE_DEMO_TZ ?? "Australia/Sydney";

// "YYYY-MM-DD" for a date in the demo timezone (defaults to now)
export function dateStrInTz(d: Date = new Date(), tz: string = DEMO_TZ): string {
  return d.toLocaleDateString("en-CA", { timeZone: tz }); // en-CA → YYYY-MM-DD
}
// shift a YYYY-MM-DD string by N days (tz-safe pure date math)
export function shiftDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// The realtime-token Edge Function endpoint (mints the OpenAI ephemeral token).
export const REALTIME_TOKEN_URL = `${SUPABASE_URL}/functions/v1/realtime-token`;
// The analyze-photo Edge Function endpoint (vision SOP scoring).
export const ANALYZE_PHOTO_URL = `${SUPABASE_URL}/functions/v1/analyze-photo`;
// Web Push: public VAPID key (safe to ship) + the send-push function endpoint.
export const VAPID_PUBLIC_KEY =
  "BDTKGbLPfkufotwLZNhI_n3s_TTdOWKG18lwuSNHIp4jGrQ_90Tija2nbS5iuZ8BUTfPSiB34lgYKL_CQGPiZZI";
export const SEND_PUSH_URL = `${SUPABASE_URL}/functions/v1/send-push`;
