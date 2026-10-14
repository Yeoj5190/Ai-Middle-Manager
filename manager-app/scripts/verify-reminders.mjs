// Verifies the AI reminder-call loop against the live DB:
//  1. fire-EXACTLY-ONCE: a due reminder is called once even if the scheduler
//     ticks twice.
//  2. quiet hours: a due reminder does NOT fire inside the quiet window.
//  3. manual "Call now": routes through call_now (authenticated, org-checked).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ORG = process.env.NEXT_PUBLIC_DEMO_ORG_ID;
const db = createClient(url, secret, { auth: { persistSession: false } });

let failures = 0;
const ok = (c, m) => { console.log((c ? "✓ " : "✗ ") + m); if (!c) failures++; };

async function insertDueReminder(tag) {
  const { data, error } = await db.from("reminders").insert({
    org_id: ORG, employee_id: "jamal", task_id: "T-4829",
    scheduled_for: new Date(Date.now() - 60_000).toISOString(),
    note: tag, source: "scheduled", status: "pending",
  }).select("id").single();
  if (error) throw new Error("insert reminder: " + error.message);
  return data.id;
}
const logCount = async (rid) => (await db.from("call_logs").select("id", { count: "exact", head: true }).eq("reminder_id", rid)).count;
const status = async (rid) => (await db.from("reminders").select("status").eq("id", rid).single()).data?.status;

// ── 1. fire exactly once ─────────────────────────────────────────────────────
console.log("\n— fire-exactly-once —");
const r1 = await insertDueReminder("verify: fire-once " + Date.now());
const { data: n1 } = await db.rpc("process_due_reminders");
const { data: n2 } = await db.rpc("process_due_reminders"); // second tick
const calls1 = await logCount(r1);
ok(calls1 === 1, `due reminder produced exactly 1 call after two scheduler ticks (got ${calls1})`);
ok((await status(r1)) === "done", `reminder marked done (got ${await status(r1)})`);
console.log(`  (tick1 fired ${n1}, tick2 fired ${n2} reminders total)`);

// ── 2. quiet hours block ─────────────────────────────────────────────────────
console.log("\n— quiet hours —");
// set quiet window to cover 'now' in UTC so the call must be suppressed
const nowUtcH = new Date().getUTCHours();
const qs = String((nowUtcH + 23) % 24).padStart(2, "0") + ":00:00"; // 1h before now
const qe = String((nowUtcH + 1) % 24).padStart(2, "0") + ":00:00";  // 1h after now
await db.from("reminder_settings").upsert({ org_id: ORG, enabled: true, quiet_start: qs, quiet_end: qe, timezone: "UTC", updated_at: new Date().toISOString() });
const r2 = await insertDueReminder("verify: quiet " + Date.now());
await db.rpc("process_due_reminders");
const calls2 = await logCount(r2);
ok(calls2 === 0, `due reminder inside quiet hours did NOT fire (got ${calls2} calls)`);
ok((await status(r2)) === "pending", `quiet-hour reminder still pending (got ${await status(r2)})`);
// restore settings + clean the held reminder
await db.from("reminder_settings").upsert({ org_id: ORG, enabled: true, quiet_start: "21:00:00", quiet_end: "08:00:00", timezone: "Australia/Sydney", updated_at: new Date().toISOString() });
await db.from("reminders").delete().eq("id", r2);

// ── 3. manual Call now (authenticated path) ──────────────────────────────────
console.log("\n— manual Call now —");
const user = createClient(url, anon, { auth: { persistSession: false } });
const { error: sErr } = await user.auth.signInWithPassword({ email: "manager@example.com", password: "AmmDemo1234!" });
if (sErr) { ok(false, "sign in: " + sErr.message); }
else {
  const { data: callId, error: cErr } = await user.rpc("call_now", { p_employee_id: "bianca", p_task_id: null, p_note: "verify: come to the front desk" });
  ok(!cErr && !!callId, `call_now placed a manual call (${cErr ? cErr.message : callId})`);
  if (callId) {
    const { data: row } = await db.from("call_logs").select("source, outcome").eq("id", callId).single();
    ok(row?.source === "manual", `manual call logged with source='manual' (got ${row?.source})`);
  }
}

// cleanup the fire-once test reminder
await db.from("reminders").delete().eq("id", r1);

console.log(failures === 0 ? "\nALL CHECKS PASSED ✅" : `\n${failures} CHECK(S) FAILED ❌`);
process.exit(failures === 0 ? 0 : 1);
