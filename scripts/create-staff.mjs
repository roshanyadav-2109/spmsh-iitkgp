#!/usr/bin/env node
/**
 * Bootstrap a staff account.
 *
 * There is no self-registration, and staff accounts are normally created by a
 * `tech` user in /portal/admin. This script exists for the one case that
 * cannot work that way: creating the very first `tech` account on a new
 * install. Keep using the portal after that, because the portal writes the
 * audit log and this does not.
 *
 *   node scripts/create-staff.mjs --email tech1@spmhospital.local \
 *        --name "A. Name" --role tech --password "..."
 *
 * Optional for a doctor account: --doctor-slug sample-doctor-one
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */

import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

function loadEnv(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const at = line.indexOf("=");
    if (at <= 0 || line.trim().startsWith("#")) continue;
    const key = line.slice(0, at).trim();
    if (process.env[key] === undefined) process.env[key] = line.slice(at + 1);
  }
}

loadEnv(".env.local");

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_BASE || !SECRET) {
  process.stdout.write("create-staff — .env.local is incomplete\n");
  process.exit(1);
}

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const email = arg("email");
const name = arg("name");
const role = arg("role");
const doctorSlug = arg("doctor-slug");
// A generated password is stronger than one typed on a command line, and it
// does not end up in the shell history.
const password = arg("password") ?? `${randomBytes(12).toString("base64url")}Aa1!`;

if (!email || !name || !["tech", "reception", "doctor"].includes(role ?? "")) {
  process.stdout.write(
    "Usage: node scripts/create-staff.mjs --email <id> --name <name> --role <tech|reception|doctor> [--doctor-slug <slug>] [--password <pw>]\n",
  );
  process.exit(1);
}

const headers = {
  apikey: SECRET,
  Authorization: `Bearer ${SECRET}`,
  "Content-Type": "application/json",
};

const run = async () => {
  let doctorId = null;
  if (role === "doctor") {
    if (!doctorSlug) {
      process.stdout.write("A doctor account needs --doctor-slug.\n");
      process.exit(1);
    }
    const found = await (
      await fetch(`${URL_BASE}/rest/v1/doctors?select=id&slug=eq.${doctorSlug}`, {
        headers,
      })
    ).json();
    doctorId = found?.[0]?.id;
    if (!doctorId) {
      process.stdout.write(`No doctor with slug ${doctorSlug}.\n`);
      process.exit(1);
    }
  }

  const createResponse = await fetch(`${URL_BASE}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const created = await createResponse.json();

  if (!createResponse.ok) {
    process.stdout.write(
      `Could not create the account: ${created.msg ?? created.message}\n`,
    );
    process.exit(1);
  }

  const profileResponse = await fetch(`${URL_BASE}/rest/v1/staff_profiles`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({
      id: created.id,
      full_name: name,
      role,
      doctor_id: doctorId,
    }),
  });

  if (!profileResponse.ok) {
    // Never leave an auth user with no profile: it could sign in with no role.
    await fetch(`${URL_BASE}/auth/v1/admin/users/${created.id}`, {
      method: "DELETE",
      headers,
    });
    process.stdout.write(
      `Could not create the staff profile: ${await profileResponse.text()}\n`,
    );
    process.exit(1);
  }

  process.stdout.write(
    `\nAccount created.\n\n  user id   ${email}\n  password  ${password}\n  role      ${role}\n\n` +
      "Write the password down, hand it over in person, and have it changed.\n" +
      "It is not stored anywhere and cannot be shown again.\n\n",
  );
};

await run();
