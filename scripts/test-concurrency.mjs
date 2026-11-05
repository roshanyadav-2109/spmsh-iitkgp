#!/usr/bin/env node
/**
 * Concurrency test for book_appointment.
 *
 * Fires 50 simultaneous bookings at a session with capacity 10 and asserts
 * that exactly 10 succeed, that they hold tokens 1 to 10 with no gaps and no
 * duplicates, and that all 40 failures are SLOT_FULL rather than a crash.
 *
 * Bookings go through the publishable key, the same path a patient uses.
 * Setup and teardown use the secret key, because a patient cannot delete.
 *
 *   node scripts/test-concurrency.mjs
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
    const at = line.indexOf("=");
    if (at <= 0 || line.trim().startsWith("#")) continue;
    const key = line.slice(0, at).trim();
    if (process.env[key] === undefined) process.env[key] = line.slice(at + 1);
  }
}

loadEnv(".env.local");

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_BASE || !ANON || !SECRET) {
  process.stdout.write("test-concurrency — .env.local is incomplete\n");
  process.exit(1);
}

/**
 * Creates a doctor record, which is briefly visible on the public directory
 * while the test runs, and writes fifty appointments. Never point this at the
 * live hospital database.
 */
if (process.env.ALLOW_TEST_WRITES !== "1") {
  process.stdout.write(
    "\ntest-concurrency creates a temporary doctor and 50 appointments, then removes them.\n" +
      "The fixture doctor is publicly visible for the few seconds the test runs.\n\n" +
      "  Windows:  $env:ALLOW_TEST_WRITES=1; npm run test:concurrency\n" +
      "  POSIX:    ALLOW_TEST_WRITES=1 npm run test:concurrency\n\n",
  );
  process.exit(1);
}

const ATTEMPTS = 50;
const CAPACITY = 10;

/**
 * The test creates its own doctor and removes it afterwards, so it never
 * writes probe appointments against a real clinician's list and can be run
 * against any database without leaving anything behind.
 */
const FIXTURE_SLUG = "zz-test-fixture-concurrency";

const anonHeaders = {
  apikey: ANON,
  Authorization: `Bearer ${ANON}`,
  "Content-Type": "application/json",
};
const adminHeaders = {
  apikey: SECRET,
  Authorization: `Bearer ${SECRET}`,
  "Content-Type": "application/json",
};

const failures = [];
function check(ok, name, detail) {
  process.stdout.write(
    `${ok ? "PASS" : "FAIL"}  ${name}${detail ? `\n        ${detail}` : ""}\n`,
  );
  if (!ok) failures.push(name);
}

/** The IST date n days from today. Never derived from toISOString. */
function istDatePlus(days) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = formatter.format(new Date());
  const [y, m, d] = today.split("-").map(Number);
  const moved = new Date(Date.UTC(y, m - 1, d, 12) + days * 86_400_000);
  return `${moved.getUTCFullYear()}-${String(moved.getUTCMonth() + 1).padStart(2, "0")}-${String(moved.getUTCDate()).padStart(2, "0")}`;
}

/** Removes the fixture doctor and everything hanging off it. */
async function teardown() {
  const existing = await (
    await fetch(`${URL_BASE}/rest/v1/doctors?select=id&slug=eq.${FIXTURE_SLUG}`, {
      headers: adminHeaders,
    })
  ).json();
  for (const row of existing ?? []) {
    await fetch(`${URL_BASE}/rest/v1/appointments?doctor_id=eq.${row.id}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    await fetch(`${URL_BASE}/rest/v1/doctors?id=eq.${row.id}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
  }
}

/** Creates a doctor sitting every day of the week with a 10-token session. */
async function setup() {
  await teardown();

  const created = await (
    await fetch(`${URL_BASE}/rest/v1/doctors`, {
      method: "POST",
      headers: { ...adminHeaders, Prefer: "return=representation" },
      body: JSON.stringify({
        full_name: "Test Fixture, concurrency",
        slug: FIXTURE_SLUG,
        designation: "Automated test fixture. Safe to delete.",
        display_order: 9999,
      }),
    })
  ).json();

  const doctor = created?.[0];
  if (!doctor?.id) {
    process.stdout.write(`test-concurrency — could not create the fixture doctor\n`);
    process.exit(1);
  }

  await fetch(`${URL_BASE}/rest/v1/doctor_schedules`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify(
      [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
        doctor_id: doctor.id,
        weekday,
        start_time: "10:00",
        end_time: "12:00",
        slot_minutes: 10,
        max_patients: CAPACITY,
      })),
    ),
  });

  return doctor;
}

const run = async () => {
  const doctor = await setup();
  const onDate = istDatePlus(3);
  const capacity = CAPACITY;

  process.stdout.write(
    `\nTarget: ${doctor.full_name}, ${onDate}, capacity ${capacity}, ${ATTEMPTS} simultaneous attempts\n\n`,
  );

  // ---- Fire everything at once ---------------------------------------------
  const started = Date.now();
  const settled = await Promise.all(
    Array.from({ length: ATTEMPTS }, (_, index) =>
      fetch(`${URL_BASE}/rest/v1/rpc/book_appointment`, {
        method: "POST",
        headers: anonHeaders,
        body: JSON.stringify({
          p_doctor_id: doctor.id,
          p_on_date: onDate,
          // A distinct number per attempt, so the per-phone guard is not what
          // is being measured here.
          p_patient_phone: `9${String(100000000 + index).padStart(9, "0")}`,
          p_patient_name: `Load Probe ${index + 1}`,
          p_patient_age: 30,
          p_patient_sex: "Other",
          p_patient_type: "Other",
        }),
      }).then(async (response) => ({
        status: response.status,
        body: await response.json(),
      })),
    ),
  );
  const elapsed = Date.now() - started;

  const succeeded = settled.filter((r) => r.status < 400);
  const failed = settled.filter((r) => r.status >= 400);
  const tokens = succeeded.map((r) => r.body[0]?.token_no).sort((a, b) => a - b);
  const refs = succeeded.map((r) => r.body[0]?.booking_ref);

  process.stdout.write(`Completed in ${elapsed} ms\n\n`);

  check(
    succeeded.length === capacity,
    `exactly ${capacity} bookings succeed`,
    `${succeeded.length} succeeded, ${failed.length} refused`,
  );

  const expected = Array.from({ length: capacity }, (_, i) => i + 1);
  check(
    JSON.stringify(tokens) === JSON.stringify(expected),
    `tokens are 1 to ${capacity} with no gaps and no duplicates`,
    `got [${tokens.join(", ")}]`,
  );

  check(
    new Set(refs).size === refs.length,
    "every booking reference is unique",
    `${new Set(refs).size} distinct of ${refs.length}`,
  );

  check(
    refs.every((ref) => /^SPM-[A-HJ-NP-Z2-9]{6}$/.test(ref ?? "")),
    "references use the unambiguous alphabet",
  );

  const codes = new Set(failed.map((r) => r.body?.message));
  check(
    failed.every((r) => r.body?.message === "SLOT_FULL"),
    "every refusal is SLOT_FULL",
    `codes seen: ${[...codes].join(", ") || "none"}`,
  );

  // ---- Capacity is what the database says it is ----------------------------
  const live = await (
    await fetch(
      `${URL_BASE}/rest/v1/appointments?select=token_no&doctor_id=eq.${doctor.id}&on_date=eq.${onDate}&status=neq.cancelled`,
      { headers: adminHeaders },
    )
  ).json();
  check(
    live.length === capacity,
    "the table holds exactly the capacity",
    `${live.length} rows`,
  );

  const availability = await (
    await fetch(`${URL_BASE}/rest/v1/rpc/get_availability`, {
      method: "POST",
      headers: anonHeaders,
      body: JSON.stringify({ p_doctor_id: doctor.id, p_from: onDate, p_to: onDate }),
    })
  ).json();
  const row = availability[0];
  check(
    row && row.booked === capacity && row.is_full === true && row.is_open === false,
    "get_availability agrees the session is full",
    row ? `booked ${row.booked} of ${row.capacity}, is_open ${row.is_open}` : "no row",
  );

  // ---- A cancellation frees capacity but not the number --------------------
  const firstRef = refs[0];
  await fetch(`${URL_BASE}/rest/v1/rpc/cancel_public_appointment`, {
    method: "POST",
    headers: anonHeaders,
    body: JSON.stringify({
      p_ref: firstRef,
      p_phone: "9100000000",
      p_reason: "concurrency test",
    }),
  });

  const afterCancel = await (
    await fetch(`${URL_BASE}/rest/v1/rpc/book_appointment`, {
      method: "POST",
      headers: anonHeaders,
      body: JSON.stringify({
        p_doctor_id: doctor.id,
        p_on_date: onDate,
        p_patient_phone: "9200000000",
        p_patient_name: "Load Probe Refill",
        p_patient_age: 30,
        p_patient_sex: "Other",
        p_patient_type: "Other",
      }),
    })
  ).json();

  check(
    afterCancel[0]?.token_no === capacity + 1,
    "a cancellation frees the place but not the token number",
    `refill got token ${afterCancel[0]?.token_no ?? afterCancel?.message}, expected ${capacity + 1}`,
  );

  // ---- Teardown ------------------------------------------------------------
  // The fixture doctor is is_active while the test runs, because a booking
  // against an inactive doctor is refused. That means it is briefly visible on
  // the public directory, so removing it again is not optional.
  await teardown();
  await fetch(`${URL_BASE}/rest/v1/audit_log?entity=eq.appointments`, {
    method: "DELETE",
    headers: adminHeaders,
  });

  const stillThere = await (
    await fetch(`${URL_BASE}/rest/v1/doctors?select=id&slug=eq.${FIXTURE_SLUG}`, {
      headers: adminHeaders,
    })
  ).json();
  check(
    Array.isArray(stillThere) && stillThere.length === 0,
    "the fixture doctor is removed again",
    `${Array.isArray(stillThere) ? stillThere.length : "?"} left behind`,
  );

  process.stdout.write(
    `\ntest-concurrency — ${failures.length === 0 ? "all checks passed" : `${failures.length} check(s) failed`}\n`,
  );
  process.exit(failures.length === 0 ? 0 : 1);
};

await run();
