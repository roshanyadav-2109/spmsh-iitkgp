#!/usr/bin/env node
/**
 * Sample appointment data: one month behind, three days ahead, every doctor.
 *
 * This existed only as a series of ad-hoc calls last time, so when the project
 * was lost the data could not be rebuilt without doing the whole job again.
 * It is a script now for that reason.
 *
 * WHAT IT COVERS, deliberately, so every screen in the portal has something
 * real to show rather than an empty state:
 *   - all five statuses, weighted by how far in the past the date is
 *   - both sources, public and reception, and telephone bookings
 *   - overflow tokens (the W series), which sort last everywhere
 *   - all five patient types, with roll or employee numbers where the
 *     patient_id_required constraint demands them
 *   - cancellations, every one carrying a reason, as cancel_reason_present
 *     demands
 *   - repeated mobile numbers, so the per-number booking limit has something
 *     to catch
 *   - all four kinds of schedule exception, one of them still awaiting
 *     approval so the reception queue is not empty
 *   - a hospital holiday
 *
 * Nothing here is a real patient. The names are common Indian given and family
 * names combined by a seeded generator, and the mobile numbers are in the
 * valid Indian range but assigned at random.
 *
 * The generator is seeded, so a second run produces the same people. Re-running
 * refuses to double the data unless --replace is passed.
 *
 *   node scripts/seed-appointments.mjs
 *   node scripts/seed-appointments.mjs --replace
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local. It writes through
 * PostgREST as the service role, which is why it can insert rows the anon role
 * is forbidden to touch.
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
    if (process.env[key] === undefined) process.env[key] = line.slice(at + 1).trim();
  }
}

loadEnv(".env.local");

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REPLACE = process.argv.includes("--replace");
/* --append keeps what is there and adds to it; --past-only stops at today and
   writes no future clinic changes or holidays, so a live site's booking
   calendar is untouched; --seed=N gives a different set of sample people. */
const APPEND = process.argv.includes("--append");
const PAST_ONLY = process.argv.includes("--past-only");
const SEED_ARG = process.argv.find((arg) => arg.startsWith("--seed="));

const say = (line) => process.stdout.write(line + "\n");

if (!BASE || !SECRET) {
  say("seed-appointments — .env.local is incomplete");
  process.exit(1);
}

const headers = {
  apikey: SECRET,
  Authorization: "Bearer " + SECRET,
  "Content-Type": "application/json",
};

async function rest(path, init = {}) {
  const response = await fetch(BASE + "/rest/v1/" + path, {
    ...init,
    headers: { ...headers, ...init.headers },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      (init.method ?? "GET") + " " + path + " -> " + response.status + " " + text.slice(0, 400),
    );
  }
  return text ? JSON.parse(text) : null;
}

/* Seeded so the same run produces the same people every time. An unseeded
   generator would mean a fresh set of names and numbers on every rebuild,
   which makes a screenshot from yesterday impossible to compare with one
   taken today. */
let seed = SEED_ARG ? Number(SEED_ARG.slice(7)) | 0 : 20260906;
function random() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (list) => list[Math.floor(random() * list.length)];
const between = (low, high) => low + Math.floor(random() * (high - low + 1));

const GIVEN_M = [
  "Arjun", "Rahul", "Soumitra", "Debashis", "Pranab", "Sourav", "Anirban",
  "Tapas", "Bikash", "Subhankar", "Rajesh", "Amit", "Kaushik", "Sandip",
  "Prasenjit", "Manoj", "Ritesh", "Abhijit", "Sujoy", "Nilanjan",
];
const GIVEN_F = [
  "Ananya", "Priya", "Sharmila", "Rituparna", "Moumita", "Sudeshna",
  "Paromita", "Ipsita", "Anwesha", "Debjani", "Sanchari", "Rima",
  "Madhumita", "Srabani", "Tanushree", "Piyali", "Aparajita", "Sohini",
  "Rupali", "Jhuma",
];
const FAMILY = [
  "Das", "Ghosh", "Chatterjee", "Banerjee", "Roy", "Sen", "Dutta", "Bose",
  "Mitra", "Nandi", "Sarkar", "Pal", "Biswas", "Kundu", "Maity", "Bhowmik",
  "Adhikari", "Chakraborty", "Dey", "Halder", "Singh", "Yadav", "Kumar",
  "Mahato", "Patra",
];

/* Nulls are in the list on purpose: most people give no reason, and a board on
   which every row carries one reads as invented. */
const REASONS = [
  "Fever and body ache for four days", "Follow-up review", "Persistent cough",
  "Routine check-up", "Chest discomfort on exertion", "Abdominal pain",
  "Headache, not settling", "Swelling in the ankle", "Report review",
  "Skin rash", "Breathlessness climbing stairs", "Back pain after lifting",
  null, null, null, null,
];

const CANCELLATIONS = [
  "Patient could not attend",
  "Cancelled by the patient over the telephone",
  "Doctor unavailable, patient asked to rebook",
  "Patient rebooked for another day",
  "Duplicate booking, this one withdrawn",
];

const REMARKS = [
  "Reviewed. Continue current medication.",
  "Investigations advised.",
  "Follow-up in two weeks.",
  "Referred for further evaluation.",
];

/* patient_id_required: Student, Staff and Faculty must carry a roll or
   employee number. Dependants and visitors often have none. */
const TYPES = [
  {
    type: "Student",
    weight: 34,
    id: () => String(between(19, 24)) + pick(["ME", "CS", "EE", "CH", "MA", "BT", "CE"]) + String(between(10000, 99999)),
  },
  { type: "Staff", weight: 22, id: () => "EMP" + String(between(10000, 99999)) },
  { type: "Faculty", weight: 14, id: () => "FAC" + String(between(1000, 9999)) },
  { type: "Dependent", weight: 20, id: () => null },
  { type: "Other", weight: 10, id: () => null },
];
const TYPE_BAG = TYPES.flatMap((entry) => Array(entry.weight).fill(entry));

/* The reference alphabet excludes I, O, 0 and 1, so a code read down a
   telephone line cannot come back as a different code. */
const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const usedRefs = new Set();
function bookingRef() {
  for (;;) {
    let ref = "SPM-";
    for (let i = 0; i < 6; i += 1) {
      ref += REF_ALPHABET[Math.floor(random() * REF_ALPHABET.length)];
    }
    if (!usedRefs.has(ref)) {
      usedRefs.add(ref);
      return ref;
    }
  }
}

/* A pool rather than a fresh number each time, so some numbers repeat across
   dates. Reception needs to see a returning patient, and the limit on how many
   bookings one number may make needs something to act on. */
const PHONES = Array.from({ length: 220 }, () => {
  let phone = String(between(6, 9));
  for (let i = 0; i < 9; i += 1) phone += String(between(0, 9));
  return phone;
});

/* Dates are plain IST calendar dates. on_date is a date column and the site
   renders everything in Asia/Kolkata, so building these off a UTC clock would
   shift the 05:30 boundary and put a morning clinic on the wrong day. */
function istToday() {
  const now = new Date();
  const ist = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
}
const iso = (date) => date.toISOString().slice(0, 10);
const shift = (date, days) => new Date(date.getTime() + days * 86400000);

function clockAt(startTime, slotMinutes, index) {
  const parts = startTime.split(":").map(Number);
  const total = parts[0] * 60 + parts[1] + slotMinutes * index;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return hh + ":" + mm + ":00";
}

const run = async () => {
  const existing = await rest("appointments?select=id&limit=1");
  if (APPEND) {
    // PostgREST returns at most 1000 rows per request, so read in pages.
    let total = 0;
    for (let from = 0; ; from += 1000) {
      const page = await rest("appointments?select=booking_ref&order=booking_ref", {
        headers: { Range: from + "-" + (from + 999) },
      });
      for (const row of page) usedRefs.add(row.booking_ref);
      total += page.length;
      if (page.length < 1000) break;
    }
    say("Appending; " + total + " existing references kept clear.");
  } else if (existing.length > 0 && !REPLACE) {
    say("There are already appointments in this project.");
    say("Pass --replace to clear them and rebuild.");
    process.exit(1);
  }
  if (existing.length > 0 && REPLACE && !APPEND) {
    say("Clearing existing appointments and schedule changes.");
    await rest("appointments?id=not.is.null", { method: "DELETE" });
    await rest("schedule_exceptions?id=not.is.null", { method: "DELETE" });
  }

  const doctors = await rest("doctors?select=id,full_name,is_active&order=full_name");
  const schedules = await rest(
    "doctor_schedules?select=doctor_id,weekday,start_time,end_time,slot_minutes,max_patients,is_active",
  );
  const active = doctors.filter((doctor) => doctor.is_active);
  const live = schedules.filter((item) => item.is_active);

  if (active.length === 0) throw new Error("No doctors in this project. Apply the migrations first.");
  if (live.length === 0) throw new Error("No clinic schedules in this project. Apply the migrations first.");

  say(active.length + " doctors, " + live.length + " weekly clinic sessions.");

  const today = istToday();
  const rows = [];

  for (let offset = -30; offset <= (PAST_ONLY ? 0 : 3); offset += 1) {
    const date = shift(today, offset);
    const weekday = date.getUTCDay();

    for (const doctor of active) {
      const session = live.find(
        (item) => item.doctor_id === doctor.id && item.weekday === weekday,
      );
      if (!session) continue;

      /* Never a full clinic every day: a board on which every session is at
         capacity tells reception nothing about which one is filling up. */
      const filled = Math.max(3, Math.round(session.max_patients * (0.55 + random() * 0.42)));
      const overflow = offset < 0 && random() < 0.18 ? between(1, 3) : 0;

      for (let index = 0; index < filled + overflow; index += 1) {
        const isOverflow = index >= filled;
        const tokenNo = isOverflow ? index - filled + 1 : index + 1;

        const female = random() < 0.48;
        const name = pick(female ? GIVEN_F : GIVEN_M) + " " + pick(FAMILY);
        const kind = pick(TYPE_BAG);

        let status;
        if (offset < 0) {
          const roll = random();
          status =
            roll < 0.72 ? "attended" : roll < 0.84 ? "no_show" : roll < 0.95 ? "cancelled" : "arrived";
        } else if (offset === 0) {
          const roll = random();
          status =
            roll < 0.4 ? "attended" : roll < 0.62 ? "arrived" : roll < 0.94 ? "booked" : "cancelled";
        } else {
          status = random() < 0.93 ? "booked" : "cancelled";
        }

        const source = random() < 0.62 ? "public" : "reception";
        const attended = status === "attended";

        rows.push({
          booking_ref: bookingRef(),
          doctor_id: doctor.id,
          on_date: iso(date),
          token_no: tokenNo,
          is_overflow: isOverflow,
          slot_time: clockAt(session.start_time, session.slot_minutes, isOverflow ? filled : index),
          patient_name: name,
          patient_age: kind.type === "Student" ? between(17, 26) : between(1, 84),
          patient_sex: female ? "Female" : "Male",
          patient_phone: pick(PHONES),
          patient_type: kind.type,
          patient_id_no: kind.id(),
          reason: pick(REASONS),
          status,
          source,
          booked_over_phone: source === "reception" && random() < 0.22,
          cancel_reason: status === "cancelled" ? pick(CANCELLATIONS) : null,
          doctor_remarks: attended && random() < 0.3 ? pick(REMARKS) : null,
        });
      }
    }
  }

  /* PostgREST refuses a bulk insert whose rows do not all carry the same keys,
     and token_label is generated by the database and may not be sent at all.
     Both of those cost a debugging session last time. */
  const keys = Object.keys(rows[0]);
  for (const row of rows) {
    for (const key of keys) if (!(key in row)) row[key] = null;
  }

  say("Inserting " + rows.length + " appointments.");
  for (let at = 0; at < rows.length; at += 250) {
    const chunk = rows.slice(at, at + 250);
    await rest("appointments", {
      method: "POST",
      body: JSON.stringify(chunk),
      headers: { Prefer: "return=minimal" },
    });
    process.stdout.write("  " + Math.min(at + chunk.length, rows.length) + "/" + rows.length + "\r");
  }
  say("");

  /* All four kinds of change, on doctors who actually hold clinics, plus one
     left unapproved so the reception approval queue is not empty. */
  if (PAST_ONLY) {
    say("Past only: no clinic changes or holidays written.");
    say("Done. " + rows.length + " appointments from " + iso(shift(today, -30)) + " to " + iso(today) + ".");
    return;
  }
  const withSessions = active.filter((doctor) =>
    live.some((item) => item.doctor_id === doctor.id),
  );
  const nowIso = new Date().toISOString();
  const plan = [
    { at: 0, days: 5, kind: "cancelled", reason: "Doctor on academic leave", approved: true, start: null, end: null, max: null },
    { at: 1, days: 2, kind: "modified", reason: "Session starts an hour later than usual", approved: true, start: "10:00:00", end: "13:00:00", max: 15 },
    { at: 2, days: 3, kind: "extra", reason: "Additional evening clinic", approved: true, start: "17:00:00", end: "19:00:00", max: 12 },
    { at: 3, days: 6, kind: "holiday", reason: "Personal leave, awaiting approval", approved: false, start: null, end: null, max: null },
  ];
  const exceptions = plan.map((entry) => ({
    doctor_id: withSessions[entry.at % withSessions.length].id,
    on_date: iso(shift(today, entry.days)),
    kind: entry.kind,
    start_time: entry.start,
    end_time: entry.end,
    max_patients: entry.max,
    reason: entry.reason,
    approved_at: entry.approved ? nowIso : null,
  }));

  await rest("schedule_exceptions?on_conflict=doctor_id,on_date,kind", {
    method: "POST",
    body: JSON.stringify(exceptions),
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  });
  say(exceptions.length + " clinic changes, one of them still awaiting approval.");

  await rest("hospital_holidays?on_conflict=on_date", {
    method: "POST",
    body: JSON.stringify([
      { on_date: iso(shift(today, 9)), reason: "Hospital closed for a public holiday" },
    ]),
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  });
  say("1 hospital holiday.");

  const counts = {};
  for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1;
  say("");
  say("Done. " + rows.length + " appointments from " + iso(shift(today, -30)) + " to " + iso(shift(today, 3)) + ".");
  for (const [status, count] of Object.entries(counts)) say("  " + status + ": " + count);
  say("  overflow tokens: " + rows.filter((row) => row.is_overflow).length);
  say("  booked at the counter: " + rows.filter((row) => row.source === "reception").length);
  say("  telephone bookings: " + rows.filter((row) => row.booked_over_phone).length);
};

run().catch((error) => {
  say("");
  say("Failed: " + error.message);
  process.exit(1);
});
