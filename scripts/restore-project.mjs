/**
 * Bring the Supabase project back from paused, and wait until it can actually
 * answer a query.
 *
 * Supabase pauses a free-tier project after a stretch of inactivity, and a
 * paused project's API hostname is withdrawn from DNS altogether — so the
 * failure does not look like "database asleep", it looks like ENOTFOUND, and
 * every page on the site renders empty after a fourteen-second wait.
 *
 * THE TOKEN IS READ FROM THE ENVIRONMENT AND IS NEVER WRITTEN ANYWHERE. It is
 * a personal access token for the Management API: it can create and delete
 * projects, so it does not belong in .env.local beside the project keys, in
 * any NEXT_PUBLIC_ variable, or in this repository. Pass it for the one
 * command and let it leave with the shell:
 *
 *   SUPABASE_ACCESS_TOKEN=... node scripts/restore-project.mjs
 *
 * The project reference is read from .env.local so there is one place that
 * says which project this is.
 */
import { readFileSync } from "node:fs";
import { resolve as resolveDns } from "node:dns/promises";

/* The lint rule forbids console in this project; scripts write to the stream
   directly, as the other scripts here do. */
const say = (line) => process.stdout.write(`${line}\n`);
const warn = (line) => process.stderr.write(`${line}\n`);

const API = "https://api.supabase.com/v1";

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  warn(
    "No SUPABASE_ACCESS_TOKEN in the environment.\n" +
      "Create one at https://supabase.com/dashboard/account/tokens and run:\n" +
      "  SUPABASE_ACCESS_TOKEN=... node scripts/restore-project.mjs",
  );
  process.exit(1);
}

/* The ref is the first label of the project hostname. */
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
const ref = url?.match(/https:\/\/([a-z0-9]+)\.supabase\./)?.[1];
if (!ref) {
  warn("Could not read the project reference from .env.local.");
  process.exit(1);
}

const auth = { Authorization: `Bearer ${token}` };

async function api(path, init) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...auth, "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.text();
  if (!response.ok) {
    /* The token itself is never echoed, including in an error. */
    throw new Error(`${init?.method ?? "GET"} ${path} -> ${response.status} ${body.slice(0, 300)}`);
  }
  return body ? JSON.parse(body) : null;
}

const projects = await api("/projects");
const project = projects.find((candidate) => candidate.id === ref);

if (!project) {
  warn(
    `Project ${ref} is not on this account.\n` +
      "Either the token belongs to a different account, or the project was deleted.\n" +
      `Projects this token can see: ${projects.map((p) => `${p.name} (${p.id}, ${p.status})`).join(", ") || "none"}`,
  );
  process.exit(1);
}

say(`${project.name} (${ref}) is ${project.status}.`);

if (project.status === "ACTIVE_HEALTHY") {
  say("Already running. Nothing to restore.");
} else {
  await api(`/projects/${ref}/restore`, { method: "POST", body: "{}" });
  say("Restore requested. This usually takes a few minutes.");
}

/* Status first, then DNS, then a real query — because the project reports
   healthy before its hostname is back in DNS, and answers DNS before
   PostgREST will serve a row. Only the third one means the site works. */
const anonKey = env.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim();
const deadline = Date.now() + 10 * 60 * 1000;

while (Date.now() < deadline) {
  await new Promise((done) => setTimeout(done, 15000));

  const current = (await api(`/projects/${ref}`)).status;
  let dns = false;
  try {
    await resolveDns(new URL(url).hostname);
    dns = true;
  } catch {
    dns = false;
  }

  let rows = null;
  if (dns) {
    try {
      const response = await fetch(`${url}/rest/v1/departments?select=name&limit=1`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      rows = response.ok ? (await response.json()).length : null;
    } catch {
      rows = null;
    }
  }

  say(`${current} · DNS ${dns ? "resolves" : "not yet"} · query ${rows === null ? "not yet" : "answered"}`);

  if (current === "ACTIVE_HEALTHY" && dns && rows !== null) {
    say("\nThe project is back and serving rows. Restart the dev server.");
    process.exit(0);
  }
}

warn("\nStill not serving after ten minutes. Check the dashboard.");
process.exit(1);
