#!/usr/bin/env node
/**
 * Role enforcement test.
 *
 * Signs in as a real reception account and two real doctor accounts and checks
 * the boundaries the brief specifies. Everything goes over HTTP with the
 * publishable key and a genuine session, so what is being tested is the
 * database's own enforcement rather than the UI's willingness to render a
 * button.
 *
 *   node scripts/test-roles.mjs
 *
 * Expects the accounts created by scripts/create-staff.mjs.
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

// Test account passwords come from the environment, never from this file:
// TEST_RECEPTION_PASSWORD, TEST_DOCTOR1_PASSWORD, TEST_DOCTOR2_PASSWORD.
const ACCOUNTS = {
  reception: {
    email: "reception1@spmhospital.local",
    password: process.env.TEST_RECEPTION_PASSWORD ?? "",
  },
  doctorOne: {
    email: "doctor1@spmhospital.local",
    password: process.env.TEST_DOCTOR1_PASSWORD ?? "",
  },
  doctorTwo: {
    email: "doctor2@spmhospital.local",
    password: process.env.TEST_DOCTOR2_PASSWORD ?? "",
  },
};
for (const [role, account] of Object.entries(ACCOUNTS)) {
  if (!account.password) {
    console.error(`Set the password for the ${role} test account in the environment.`);
    process.exit(1);
  }
}

/**
 * Doctor scoping can only be tested against the doctor records the two test
 * logins are actually linked to, so unlike the concurrency test this one
 * writes probe appointments onto real clinicians' lists and deletes them
 * again. That is fine on a development project and unacceptable on a live
 * one, so it refuses to run without an explicit opt-in.
 */
if (process.env.ALLOW_TEST_WRITES !== "1") {
  process.stdout.write(
    "\ntest-roles writes probe appointments to the database and deletes them again.\n" +
      "It must never be pointed at the live hospital database.\n\n" +
      "  Windows:  $env:ALLOW_TEST_WRITES=1; npm run test:roles\n" +
      "  POSIX:    ALLOW_TEST_WRITES=1 npm run test:roles\n\n",
  );
  process.exit(1);
}

const failures = [];
function check(ok, name, detail) {
  process.stdout.write(
    `${ok ? "PASS" : "FAIL"}  ${name}${detail ? `\n        ${detail}` : ""}\n`,
  );
  if (!ok) failures.push(name);
}

const adminHeaders = {
  apikey: SECRET,
  Authorization: `Bearer ${SECRET}`,
  "Content-Type": "application/json",
};

async function signIn(account) {
  const response = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify(account),
  });
  const body = await response.json();
  if (!body.access_token) {
    throw new Error(`Could not sign in as ${account.email}: ${JSON.stringify(body)}`);
  }
  return {
    apikey: ANON,
    Authorization: `Bearer ${body.access_token}`,
    "Content-Type": "application/json",
  };
}

function istDatePlus(days) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = formatter.format(new Date()).split("-").map(Number);
  const moved = new Date(Date.UTC(y, m - 1, d, 12) + days * 86_400_000);
  return `${moved.getUTCFullYear()}-${String(moved.getUTCMonth() + 1).padStart(2, "0")}-${String(moved.getUTCDate()).padStart(2, "0")}`;
}

const run = async () => {
  const reception = await signIn(ACCOUNTS.reception);
  const doctorOne = await signIn(ACCOUNTS.doctorOne);
  const doctorTwo = await signIn(ACCOUNTS.doctorTwo);

  // ---- Fixtures ------------------------------------------------------------
  // The doctor records the two test logins are linked to. Read from
  // staff_profiles rather than hard-coded, so this keeps working whichever
  // doctors the accounts point at.
  const profiles = await (
    await fetch(
      `${URL_BASE}/rest/v1/staff_profiles?select=doctor_id,full_name,role&role=eq.doctor`,
      { headers: adminHeaders },
    )
  ).json();

  const docOneId = profiles.find((p) => p.full_name?.includes("Nirmal"))?.doctor_id
    ?? profiles[0]?.doctor_id;
  const docTwoId = profiles.find((p) => p.doctor_id && p.doctor_id !== docOneId)?.doctor_id;

  if (!docOneId || !docTwoId) {
    throw new Error(
      "Two doctor logins linked to two different doctor records are required. Run scripts/create-staff.mjs.",
    );
  }

  // Find a date inside the booking window on which both doctors sit.
  const sessions = await (
    await fetch(
      `${URL_BASE}/rest/v1/doctor_schedules?select=doctor_id,weekday&is_active=eq.true&doctor_id=in.(${docOneId},${docTwoId})`,
      { headers: adminHeaders },
    )
  ).json();

  const daysFor = (id) =>
    new Set(sessions.filter((s) => s.doctor_id === id).map((s) => s.weekday));
  const oneDays = daysFor(docOneId);
  const twoDays = daysFor(docTwoId);

  let onDate = null;
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = istDatePlus(offset);
    const weekday = new Date(`${candidate}T12:00:00Z`).getUTCDay();
    if (oneDays.has(weekday) && twoDays.has(weekday)) {
      onDate = candidate;
      break;
    }
  }
  if (!onDate) {
    throw new Error(
      "The two linked doctors share no OPD weekday inside the booking window.",
    );
  }

  for (const id of [docOneId, docTwoId]) {
    await fetch(
      `${URL_BASE}/rest/v1/appointments?doctor_id=eq.${id}&on_date=eq.${onDate}`,
      { method: "DELETE", headers: adminHeaders },
    );
  }

  const bookAs = async (headers, doctorId, phone, name) =>
    (
      await fetch(`${URL_BASE}/rest/v1/rpc/book_appointment`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          p_doctor_id: doctorId,
          p_on_date: onDate,
          p_patient_phone: phone,
          p_patient_name: name,
          p_patient_age: 40,
          p_patient_sex: "Other",
          p_patient_type: "Other",
        }),
      })
    ).json();

  const one = await bookAs(reception, docOneId, "9811111111", "Role Probe One");
  const two = await bookAs(reception, docTwoId, "9822222222", "Role Probe Two");

  check(
    Array.isArray(one) && one[0]?.booking_ref,
    "reception can book an appointment",
    JSON.stringify(one).slice(0, 120),
  );

  const apptOne = await (
    await fetch(
      `${URL_BASE}/rest/v1/appointments?select=id&booking_ref=eq.${one[0].booking_ref}`,
      { headers: adminHeaders },
    )
  ).json();
  const apptTwo = await (
    await fetch(
      `${URL_BASE}/rest/v1/appointments?select=id&booking_ref=eq.${two[0].booking_ref}`,
      { headers: adminHeaders },
    )
  ).json();
  const idOne = apptOne[0].id;
  const idTwo = apptTwo[0].id;

  process.stdout.write("\nDoctor scoping\n");

  const ownRows = await (
    await fetch(
      `${URL_BASE}/rest/v1/appointments?select=id,doctor_id&on_date=eq.${onDate}`,
      {
        headers: doctorOne,
      },
    )
  ).json();

  check(
    Array.isArray(ownRows) && ownRows.every((row) => row.doctor_id === docOneId),
    "a doctor sees only their own appointments",
    `${Array.isArray(ownRows) ? ownRows.length : "?"} row(s), doctor ids: ${[
      ...new Set((ownRows ?? []).map((r) => r.doctor_id)),
    ].join(", ")}`,
  );

  const otherRow = await (
    await fetch(`${URL_BASE}/rest/v1/appointments?select=id&id=eq.${idTwo}`, {
      headers: doctorOne,
    })
  ).json();
  check(
    Array.isArray(otherRow) && otherRow.length === 0,
    "a doctor cannot read another doctor's appointment by id",
    `${Array.isArray(otherRow) ? otherRow.length : "?"} row(s)`,
  );

  const crossUpdate = await fetch(`${URL_BASE}/rest/v1/appointments?id=eq.${idTwo}`, {
    method: "PATCH",
    headers: { ...doctorOne, Prefer: "return=representation" },
    body: JSON.stringify({ status: "attended" }),
  });
  const crossBody = await crossUpdate.json();
  check(
    crossUpdate.status >= 400 || (Array.isArray(crossBody) && crossBody.length === 0),
    "a doctor cannot change another doctor's appointment",
    `${crossUpdate.status}, ${Array.isArray(crossBody) ? crossBody.length : "?"} row(s) affected`,
  );

  process.stdout.write("\nDoctor column restrictions\n");

  const ownStatus = await fetch(`${URL_BASE}/rest/v1/appointments?id=eq.${idOne}`, {
    method: "PATCH",
    headers: { ...doctorOne, Prefer: "return=representation" },
    body: JSON.stringify({ status: "attended", doctor_remarks: "Seen." }),
  });
  const ownStatusBody = await ownStatus.json();
  check(
    ownStatus.ok && Array.isArray(ownStatusBody) && ownStatusBody.length === 1,
    "a doctor can set status and remarks on their own patient",
    `${ownStatus.status}`,
  );

  const renameAttempt = await fetch(`${URL_BASE}/rest/v1/appointments?id=eq.${idOne}`, {
    method: "PATCH",
    headers: doctorOne,
    body: JSON.stringify({ patient_name: "Tampered Name" }),
  });
  const renameBody = await renameAttempt.json().catch(() => null);
  check(
    renameAttempt.status >= 400 &&
      JSON.stringify(renameBody).includes("DOCTOR_FIELD_FORBIDDEN"),
    "a doctor cannot change patient details",
    `${renameAttempt.status} ${JSON.stringify(renameBody?.message ?? "")}`,
  );

  const cancelAttempt = await fetch(`${URL_BASE}/rest/v1/appointments?id=eq.${idOne}`, {
    method: "PATCH",
    headers: doctorOne,
    body: JSON.stringify({ status: "cancelled", cancel_reason: "no" }),
  });
  const cancelBody = await cancelAttempt.json().catch(() => null);
  check(
    cancelAttempt.status >= 400,
    "a doctor cannot cancel an appointment",
    `${cancelAttempt.status} ${JSON.stringify(cancelBody?.message ?? "")}`,
  );

  process.stdout.write("\nReception boundaries\n");

  const staffInsert = await fetch(`${URL_BASE}/rest/v1/staff_profiles`, {
    method: "POST",
    headers: { ...reception, Prefer: "return=representation" },
    body: JSON.stringify({
      id: "00000000-0000-0000-0000-000000000001",
      full_name: "Smuggled Account",
      role: "tech",
    }),
  });
  const staffBody = await staffInsert.json().catch(() => null);
  check(
    staffInsert.status >= 400 || (Array.isArray(staffBody) && staffBody.length === 0),
    "reception cannot create a staff account",
    `${staffInsert.status}`,
  );

  const roleEscalation = await fetch(
    `${URL_BASE}/rest/v1/staff_profiles?role=eq.reception`,
    {
      method: "PATCH",
      headers: { ...reception, Prefer: "return=representation" },
      body: JSON.stringify({ role: "tech" }),
    },
  );
  const escalationBody = await roleEscalation.json().catch(() => null);
  check(
    roleEscalation.status >= 400 ||
      (Array.isArray(escalationBody) && escalationBody.length === 0),
    "reception cannot promote itself to technical support",
    `${roleEscalation.status}`,
  );

  const stillReception = await (
    await fetch(`${URL_BASE}/rest/v1/rpc/auth_role`, {
      method: "POST",
      headers: reception,
    })
  ).json();
  check(
    stillReception === "reception",
    "reception's role is unchanged after the attempt",
    `auth_role() is ${JSON.stringify(stillReception)}`,
  );

  const contactSetting = await fetch(
    `${URL_BASE}/rest/v1/site_settings?key=eq.emergency_phone`,
    {
      method: "PATCH",
      headers: { ...reception, Prefer: "return=representation" },
      body: JSON.stringify({ value: "0000000000" }),
    },
  );
  const contactBody = await contactSetting.json().catch(() => null);
  check(
    contactSetting.status >= 400 ||
      (Array.isArray(contactBody) && contactBody.length === 0),
    "reception cannot change the emergency number",
    `${contactSetting.status}`,
  );

  const policySetting = await fetch(
    `${URL_BASE}/rest/v1/site_settings?key=eq.booking_window_days`,
    {
      method: "PATCH",
      headers: { ...reception, Prefer: "return=representation" },
      body: JSON.stringify({ value: "7" }),
    },
  );
  const policyBody = await policySetting.json().catch(() => null);
  check(
    policySetting.ok && Array.isArray(policyBody) && policyBody.length === 1,
    "reception can change the booking window",
    `${policySetting.status}`,
  );

  process.stdout.write("\nDoctor boundaries\n");

  const doctorReadsAudit = await fetch(`${URL_BASE}/rest/v1/audit_log?select=id`, {
    headers: doctorOne,
  });
  const auditBody = await doctorReadsAudit.json().catch(() => null);
  check(
    doctorReadsAudit.status >= 400 ||
      (Array.isArray(auditBody) && auditBody.length === 0),
    "a doctor cannot read the audit log",
    `${doctorReadsAudit.status}`,
  );

  const doctorEditsSchedule = await fetch(
    `${URL_BASE}/rest/v1/doctor_schedules?doctor_id=eq.${docOneId}`,
    {
      method: "PATCH",
      headers: { ...doctorTwo, Prefer: "return=representation" },
      body: JSON.stringify({ max_patients: 1 }),
    },
  );
  const scheduleBody = await doctorEditsSchedule.json().catch(() => null);
  check(
    doctorEditsSchedule.status >= 400 ||
      (Array.isArray(scheduleBody) && scheduleBody.length === 0),
    "a doctor cannot edit a schedule",
    `${doctorEditsSchedule.status}`,
  );

  process.stdout.write("\nShared token sequence\n");

  // A public booking and a desk booking on the same doctor and date must draw
  // from one sequence.
  const publicHeaders = {
    apikey: ANON,
    Authorization: `Bearer ${ANON}`,
    "Content-Type": "application/json",
  };
  const publicBooking = await bookAs(
    publicHeaders,
    docOneId,
    "9833333333",
    "Public Probe",
  );
  const deskBooking = await bookAs(reception, docOneId, "9844444444", "Desk Probe");

  const tokens = [
    one[0].token_no,
    publicBooking[0]?.token_no,
    deskBooking[0]?.token_no,
  ];
  check(
    tokens[1] === tokens[0] + 1 && tokens[2] === tokens[0] + 2,
    "public and desk bookings share one gapless token sequence",
    `tokens issued: ${tokens.join(", ")}`,
  );

  const sources = await (
    await fetch(
      `${URL_BASE}/rest/v1/appointments?select=token_no,source,created_by&doctor_id=eq.${docOneId}&on_date=eq.${onDate}&order=token_no`,
      { headers: adminHeaders },
    )
  ).json();
  check(
    sources.some((r) => r.source === "public" && r.created_by === null) &&
      sources.some((r) => r.source === "reception" && r.created_by !== null),
    "reception bookings record who made them, public ones do not",
    sources.map((r) => `${r.token_no}:${r.source}`).join(" "),
  );

  // ---- Teardown ------------------------------------------------------------
  for (const id of [docOneId, docTwoId]) {
    await fetch(
      `${URL_BASE}/rest/v1/appointments?doctor_id=eq.${id}&on_date=eq.${onDate}`,
      { method: "DELETE", headers: adminHeaders },
    );
  }

  process.stdout.write(
    `\ntest-roles — ${failures.length === 0 ? "all checks passed" : `${failures.length} check(s) failed`}\n`,
  );
  process.exit(failures.length === 0 ? 0 : 1);
};

await run();
