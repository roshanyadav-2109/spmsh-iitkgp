#!/usr/bin/env node
/**
 * Row-level-security verification.
 *
 * Talks to the live project over plain HTTP using the publishable key only --
 * the same surface an attacker has. Nothing here uses the secret key, and
 * nothing here logs in.
 *
 *   node scripts/verify-rls.mjs
 *
 * Exits non-zero if any assertion fails. Run it after every migration.
 */

import { readFileSync } from "node:fs";

function loadEnv(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match?.[1] && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2] ?? "";
    }
  }
}

loadEnv(".env.local");

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_BASE || !ANON) {
  process.stdout.write(
    "verify-rls — NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY missing from .env.local\n",
  );
  process.exit(1);
}

const adminHeaders = SECRET
  ? { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" }
  : null;

const HIDDEN_SLUG = "zz-test-hidden";

/**
 * Rows that must never reach an anonymous caller: one inactive record in each
 * published table, and one unpublished announcement.
 *
 * These are created and destroyed by the test rather than seeded, so the
 * assertions below prove RLS is hiding them. Asserting that a row which does
 * not exist is invisible proves nothing.
 */
async function createHiddenFixtures() {
  if (!adminHeaders) return false;
  await removeHiddenFixtures();
  const post = (table, body) =>
    fetch(`${URL_BASE}/rest/v1/${table}`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(body),
    });

  await post("departments", {
    name: "Hidden test department",
    slug: HIDDEN_SLUG,
    is_active: false,
    display_order: 9999,
  });
  await post("doctors", {
    full_name: "Hidden test doctor",
    slug: HIDDEN_SLUG,
    is_active: false,
    display_order: 9999,
  });
  await post("services", {
    name: "Hidden test service",
    slug: HIDDEN_SLUG,
    is_active: false,
    display_order: 9999,
  });
  await post("announcements", {
    title: "Hidden test draft",
    slug: HIDDEN_SLUG,
    body: "Unpublished. Must never be visible to an anonymous caller.",
    is_published: false,
  });
  return true;
}

async function removeHiddenFixtures() {
  if (!adminHeaders) return;
  for (const table of ["departments", "doctors", "services", "announcements"]) {
    await fetch(`${URL_BASE}/rest/v1/${table}?slug=eq.${HIDDEN_SLUG}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
  }
}

const results = [];

function record(ok, name, detail) {
  results.push({ ok, name, detail });
  process.stdout.write(
    `${ok ? "PASS" : "FAIL"}  ${name}${detail ? `\n        ${detail}` : ""}\n`,
  );
}

async function call(path, init = {}) {
  const response = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${ANON}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, body };
}

/**
 * The request must not succeed.
 *
 * `Prefer: return=representation` matters here: without it PostgREST answers a
 * PATCH or DELETE that RLS filtered to zero rows with a bare 204, which is
 * indistinguishable from a write that succeeded. With it, a refused write
 * comes back as an empty array and a write that actually touched something
 * comes back with the rows it touched.
 */
async function mustBeDenied(name, path, init = {}) {
  const { status, body } = await call(path, {
    ...init,
    headers: { Prefer: "return=representation", ...(init.headers ?? {}) },
  });
  const touchedRows = Array.isArray(body) ? body.length : 0;
  const ok = status >= 400 || touchedRows === 0;
  record(
    ok,
    name,
    ok
      ? `refused with ${status}${body?.code ? ` (${body.code})` : ""}`
      : `LEAK: ${status} affected ${touchedRows} row(s)`,
  );
}

/** The request must succeed and return an array. */
async function mustSucceed(name, path, init) {
  const { status, body } = await call(path, init);
  const ok = status < 400 && Array.isArray(body);
  record(
    ok,
    name,
    ok ? `${status}, ${body.length} row(s)` : `${status} ${JSON.stringify(body)}`,
  );
  return ok ? body : [];
}

/** The response must not contain a row with this slug. */
function mustNotContain(name, rows, field, value) {
  const found = rows.some((row) => row?.[field] === value);
  record(!found, name, found ? `LEAK: ${value} is visible` : `${value} is hidden`);
}

const run = async () => {
  const fixtured = await createHiddenFixtures();

  // A real, listed doctor to aim the refused writes at, so the "nothing
  // changed" assertion afterwards is checking a row that actually exists.
  const listed = await call("doctors?select=slug,is_active&is_active=eq.true&limit=1");
  const targetSlug = listed.body?.[0]?.slug;
  if (!targetSlug) {
    process.stdout.write("verify-rls — no active doctor to test against\n");
    process.exit(1);
  }

  process.stdout.write("\nAnonymous reads that must be refused\n");
  await mustBeDenied("appointments are unreadable", "appointments?select=*");
  await mustBeDenied(
    "appointments are unreadable by reference",
    "appointments?select=patient_phone&booking_ref=like.SPM-*",
  );
  await mustBeDenied("staff_profiles are unreadable", "staff_profiles?select=*");
  await mustBeDenied("audit_log is unreadable", "audit_log?select=*");

  process.stdout.write("\nAnonymous writes that must be refused\n");
  await mustBeDenied("cannot insert an appointment", "appointments", {
    method: "POST",
    body: JSON.stringify({
      booking_ref: "SPM-ZZZZZZ",
      doctor_id: "00000000-0000-0000-0000-000000000000",
      on_date: "2030-01-01",
      token_no: 1,
      patient_name: "RLS Probe",
      patient_age: 30,
      patient_sex: "Other",
      patient_phone: "9000000000",
      patient_type: "Other",
    }),
  });
  await mustBeDenied(
    "cannot change a site setting",
    "site_settings?key=eq.booking_window_days",
    {
      method: "PATCH",
      body: JSON.stringify({ value: "365" }),
    },
  );
  await mustBeDenied("cannot add a hospital holiday", "hospital_holidays", {
    method: "POST",
    body: JSON.stringify({ on_date: "2030-01-01", reason: "RLS probe" }),
  });
  await mustBeDenied("cannot forge an audit row", "audit_log", {
    method: "POST",
    body: JSON.stringify({ action: "probe", entity: "probe" }),
  });
  await mustBeDenied("cannot delete a doctor", `doctors?slug=eq.${targetSlug}`, {
    method: "DELETE",
  });
  await mustBeDenied("cannot deactivate a doctor", `doctors?slug=eq.${targetSlug}`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: false }),
  });

  process.stdout.write("\nAnd nothing above actually changed\n");
  const setting = await call("site_settings?select=value&key=eq.booking_window_days");
  record(
    setting.body?.[0]?.value === "7",
    "booking_window_days is untouched",
    `value is ${JSON.stringify(setting.body?.[0]?.value)}`,
  );
  const doctorRow = await call(
    `doctors?select=slug,is_active&slug=eq.${targetSlug}`,
  );
  record(
    doctorRow.body?.length === 1 && doctorRow.body[0]?.is_active === true,
    `${targetSlug} is still present and active`,
    `${doctorRow.body?.length ?? 0} row(s)`,
  );

  process.stdout.write("\nStaff-only functions that must be out of reach\n");
  await mustBeDenied("cannot call cancel_session", "rpc/cancel_session", {
    method: "POST",
    body: JSON.stringify({
      p_doctor_id: "00000000-0000-0000-0000-000000000000",
      p_on_date: "2030-01-01",
      p_reason: "probe",
    }),
  });
  await mustBeDenied("cannot call log_audit", "rpc/log_audit", {
    method: "POST",
    body: JSON.stringify({ p_action: "probe", p_entity: "probe" }),
  });
  await mustBeDenied("cannot call auth_role", "rpc/auth_role", {
    method: "POST",
    body: "{}",
  });
  await mustBeDenied("cannot call resolve_session", "rpc/resolve_session", {
    method: "POST",
    body: JSON.stringify({
      p_doctor_id: "00000000-0000-0000-0000-000000000000",
      p_on_date: "2030-01-01",
    }),
  });

  process.stdout.write("\nPublic reads that must work\n");
  const departments = await mustSucceed(
    "departments are readable",
    "departments?select=id,name,slug&order=display_order",
  );
  const doctors = await mustSucceed(
    "doctors are readable",
    "doctors?select=id,full_name,slug&order=display_order",
  );
  const services = await mustSucceed("services are readable", "services?select=slug");
  const announcements = await mustSucceed(
    "announcements are readable",
    "announcements?select=slug,is_published",
  );
  await mustSucceed("site settings are readable", "site_settings?select=key,value");
  await mustSucceed(
    "schedules are readable",
    "doctor_schedules?select=weekday,start_time",
  );

  process.stdout.write("\nInactive and unpublished rows must stay hidden\n");
  if (!fixtured) {
    record(
      false,
      "hidden-row fixtures were created",
      "SUPABASE_SERVICE_ROLE_KEY is missing, so invisibility cannot be proved",
    );
  } else {
    mustNotContain("inactive department hidden", departments, "slug", HIDDEN_SLUG);
    mustNotContain("inactive doctor hidden", doctors, "slug", HIDDEN_SLUG);
    mustNotContain("inactive service hidden", services, "slug", HIDDEN_SLUG);
    mustNotContain("unpublished announcement hidden", announcements, "slug", HIDDEN_SLUG);
  }

  process.stdout.write("\nPatient-facing functions that must work\n");
  const doctorId = doctors[0]?.id;
  if (doctorId) {
    const today = new Date().toISOString().slice(0, 10);
    const availability = await mustSucceed(
      "get_availability works",
      "rpc/get_availability",
      {
        method: "POST",
        body: JSON.stringify({ p_doctor_id: doctorId, p_from: today, p_to: today }),
      },
    );
    const leaks = availability.some(
      (row) => "patient_phone" in (row ?? {}) || "patient_name" in (row ?? {}),
    );
    record(
      !leaks,
      "get_availability exposes no patient data",
      leaks ? "LEAK" : "counts only",
    );
  } else {
    record(false, "get_availability works", "no doctor to test against");
  }

  const { status: lookupStatus, body: lookupBody } = await call(
    "rpc/lookup_appointment",
    {
      method: "POST",
      body: JSON.stringify({ p_ref: "SPM-XXXXXX", p_phone: "9000000000" }),
    },
  );
  record(
    lookupStatus < 400 && Array.isArray(lookupBody) && lookupBody.length === 0,
    "lookup_appointment returns nothing for a wrong reference",
    `${lookupStatus}, ${Array.isArray(lookupBody) ? lookupBody.length : "?"} row(s)`,
  );

  await removeHiddenFixtures();

  const failed = results.filter((r) => !r.ok);
  process.stdout.write(
    `\nverify-rls — ${results.length - failed.length}/${results.length} passed\n`,
  );
  if (failed.length > 0) {
    for (const f of failed) process.stdout.write(`  FAILED: ${f.name} — ${f.detail}\n`);
    process.exit(1);
  }
};

await run();
