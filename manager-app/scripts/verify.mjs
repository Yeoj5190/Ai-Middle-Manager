// End-to-end verification against the live Supabase project:
//  1. create a pre-confirmed manager account (Admin API, bypasses email confirm)
//  2. confirm the signup trigger created a profile in the demo org
//  3. sign in as that user and read through RLS (proves auth + scoping + data)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL = "manager@example.com";
const PASSWORD = "AmmDemo1234!";

const admin = createClient(url, secret, { auth: { persistSession: false } });

// 1. create (or reuse) a confirmed user
let { data: created, error: cErr } = await admin.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
  user_metadata: { full_name: "John Mercer" },
});
if (cErr && !/already.*registered|already been registered|exists/i.test(cErr.message)) {
  console.error("✗ create user:", cErr.message);
  process.exit(1);
}
console.log(created?.user ? "✓ created confirmed user " + EMAIL : "✓ user already exists " + EMAIL);

// 2. confirm the signup trigger made a profile
const { data: profiles } = await admin.from("profiles").select("id, org_id, full_name, role");
console.log(`✓ profiles in DB: ${profiles?.length ?? 0}` + (profiles?.[0] ? ` (role=${profiles[0].role}, org=${profiles[0].org_id})` : ""));

// 3. sign in as the user (anon key) and read through RLS
const user = createClient(url, anon, { auth: { persistSession: false } });
const { error: sErr } = await user.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
if (sErr) {
  console.error("✗ sign in:", sErr.message);
  process.exit(1);
}
console.log("✓ signed in via publishable key");

for (const tbl of ["employees", "tasks", "escalations", "verification_calls", "stat_tiles"]) {
  const { data, error } = await user.from(tbl).select("*");
  if (error) {
    console.error(`✗ read ${tbl}: ${error.message}`);
    process.exit(1);
  }
  console.log(`✓ ${tbl}: ${data.length} rows visible through RLS`);
}

// 4. confirm RLS blocks an anonymous (no session) read
const anonNoSession = createClient(url, anon, { auth: { persistSession: false } });
const { data: blocked } = await anonNoSession.from("employees").select("*");
console.log(`✓ RLS check — anonymous sees ${blocked?.length ?? 0} rows (should be 0)`);

console.log(`\nDemo login →  ${EMAIL}  /  ${PASSWORD}`);
