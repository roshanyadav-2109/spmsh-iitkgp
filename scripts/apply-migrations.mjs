/**
 * Rebuild the database on a fresh Supabase project.
 *
 * The six files in supabase/migrations are the whole schema: tables, row level
 * security, the security-definer functions the public booking flow goes
 * through, and the reference content. They are applied in filename order and
 * each file runs as ONE statement batch, because several of them depend on
 * objects created earlier in the same file.
 *
 * DDL cannot go through PostgREST, so this uses the Management API, which
 * means a personal access token rather than the project keys. AS WITH
 * restore-project.mjs, THE TOKEN IS READ FROM THE ENVIRONMENT AND NEVER
 * WRITTEN ANYWHERE — not to .env.local, not to a NEXT_PUBLIC_ variable, not
 * into an error message:
 *
 *   SUPABASE_ACCESS_TOKEN=... node scripts/apply-migrations.mjs
 *
 * Safe to run twice: it stops at the first file that errors and says which
 * one, rather than carrying on and leaving a half-built schema behind.
 */
import { readFileSync, readdirSync } from "node:fs";

/* The lint rule forbids console in this project; scripts write to the stream
   directly, as the other scripts here do. */
const say = (line) => process.stdout.write(`${line}\n`);
const warn = (line) => process.stderr.write(`${line}\n`);
import { join } from "node:path";

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  warn(
    "No SUPABASE_ACCESS_TOKEN in the environment.\n" +
      "Create one at https://supabase.com/dashboard/account/tokens and run:\n" +
      "  SUPABASE_ACCESS_TOKEN=... node scripts/apply-migrations.mjs",
  );
  process.exit(1);
}

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
const ref = url?.match(/https:\/\/([a-z0-9]+)\.supabase\./)?.[1];
if (!ref) {
  warn("Could not read the project reference from .env.local.");
  process.exit(1);
}

const dir = new URL("../supabase/migrations/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const files = readdirSync(dir).filter((name) => name.endsWith(".sql")).sort();

say(`Applying ${files.length} migrations to ${ref}.\n`);

for (const file of files) {
  const sql = readFileSync(join(dir, file), "utf8");
  process.stdout.write(file + " … ");

  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });

  const body = await response.text();
  if (!response.ok) {
    say("failed");
    warn(`\n${file} did not apply:\n${body.slice(0, 1200)}`);
    warn("\nStopped here. Nothing after this file has been applied.");
    process.exit(1);
  }
  say("ok");
}

say("\nSchema, security and reference content are in place.");
