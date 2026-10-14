// Seed the Supabase database with the demo dataset (src/data/seed.json).
// Uses the service-role key to bypass RLS. Idempotent (upserts by primary key).
//
//   1. Run the SQL in supabase/migrations/ (0001 then 0002) in the SQL editor.
//   2. Fill NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
//   3. node scripts/seed.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// minimal .env.local loader (no dotenv dependency)
try {
  const env = readFileSync(join(root, ".env.local"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env.local — rely on process.env */
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const seed = JSON.parse(readFileSync(join(root, "src/data/seed.json"), "utf8"));
const db = createClient(url, key, { auth: { persistSession: false } });
const orgId = seed.org.id;

async function step(label, promise) {
  const { error } = await promise;
  if (error) {
    console.error(`✗ ${label}: ${error.message}`);
    process.exit(1);
  }
  console.log(`✓ ${label}`);
}

await step("org", db.from("orgs").upsert({ id: orgId, name: seed.org.name }));

await step(
  "locations",
  db.from("locations").upsert(seed.locations.map((l) => ({ ...l, org_id: orgId }))),
);

await step(
  "employees",
  db.from("employees").upsert(
    seed.employees.map((e) => ({ ...e, org_id: orgId, phone: seed.phones?.[e.id] ?? null })),
  ),
);

// quiz_records / events have generated uuids — clear org rows then insert fresh
// so re-running doesn't duplicate.
await step("clear quiz_records", db.from("quiz_records").delete().eq("org_id", orgId));
await step(
  "quiz_records",
  db.from("quiz_records").insert(seed.quiz_records.map((q) => ({ ...q, org_id: orgId }))),
);

await step("clear events", db.from("employee_events").delete().eq("org_id", orgId).eq("kind", "coaching"));
await step(
  "employee_events",
  db.from("employee_events").insert(
    seed.events.map((ev) => ({
      org_id: orgId,
      employee_id: ev.employee_id,
      kind: "coaching",
      channel: ev.channel,
      good: ev.good,
      body: ev.body,
      created_at: new Date(Date.now() - (ev.days_ago * 24 + ev.hours_ago) * 3600_000).toISOString(),
    })),
  ),
);

// ── Overview tables ──────────────────────────────────────────────────────────
await step("clear stat_tiles", db.from("stat_tiles").delete().eq("org_id", orgId));
await step("stat_tiles", db.from("stat_tiles").insert(seed.stat_tiles.map((t) => ({ ...t, org_id: orgId }))));

await step("clear briefings", db.from("briefings").delete().eq("org_id", orgId));
await step("briefings", db.from("briefings").insert({ org_id: orgId, body: seed.briefing.body, stamp: seed.briefing.stamp }));

await step("clear insights", db.from("insights").delete().eq("org_id", orgId));
await step("insights", db.from("insights").insert(seed.insights.map((i) => ({ ...i, org_id: orgId }))));

await step("verification_summary", db.from("verification_summary").upsert({ org_id: orgId, ...seed.verification }));

// ── operational surfaces ─────────────────────────────────────────────────────
await step("escalations", db.from("escalations").upsert(seed.escalations.map((e) => ({ ...e, org_id: orgId }))));
await step(
  "tasks",
  db.from("tasks").upsert(
    seed.tasks.map(({ detail, ...t }) => ({ ...t, org_id: orgId, detail: detail ?? {} })),
  ),
);
await step("verification_calls", db.from("verification_calls").upsert(seed.verification_calls.map((c) => ({ ...c, org_id: orgId }))));

await step("clear verification_turns", db.from("verification_turns").delete().eq("org_id", orgId));
await step(
  "verification_turns",
  db.from("verification_turns").insert(
    seed.verification_turns.map((t) => ({
      org_id: orgId,
      call_id: t.call_id,
      ord: t.ord,
      who: t.who,
      body: t.body,
      tag: t.tag ?? null,
      kind: t.kind ?? null,
      confidence: t.confidence ?? null,
      quality: t.quality ?? null,
      hesitation: t.hesitation ?? false,
    })),
  ),
);

// ── AI reminder calls ────────────────────────────────────────────────────────
await step(
  "reminder_settings",
  db.from("reminder_settings").upsert({ org_id: orgId, ...seed.reminder_settings }),
);

// Demo reminders with live timestamps so the scheduler has something to act on.
// One already-due (the cron should fire it on its next tick), one in the future
// (stays pending). Re-running clears prior demo reminders to stay idempotent.
await step("clear demo reminders", db.from("reminders").delete().eq("org_id", orgId));
const iso = (mins) => new Date(Date.now() + mins * 60_000).toISOString();
await step(
  "reminders",
  db.from("reminders").insert([
    { org_id: orgId, employee_id: "jamal", task_id: "T-4829", scheduled_for: iso(-1),
      note: "Re-clean Room 12 and re-submit photos before the 15:00 check-in.", source: "scheduled", status: "pending" },
    { org_id: orgId, employee_id: "marcus", task_id: "T-4822", scheduled_for: iso(45),
      note: "HVAC repair in Room 4 — bring the backup unit from Greystanes.", source: "scheduled", status: "pending" },
  ]),
);

console.log("\nSeed complete.");
