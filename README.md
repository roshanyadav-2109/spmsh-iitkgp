# Dr. Syama Prasad Mookerjee Superspeciality Hospital, IIT Kharagpur

Public website, appointment booking and staff portal, in one Next.js application
backed by Supabase.

Three things live here:

1. **Public site** — departments, doctors, services, administration,
   announcements, contact and emergency information.
2. **Public booking** — patients complete the appointment form and receive their
   appointment details.
3. **Staff portal** — `reception`, `doctor` and `tech` behind one login.

---

## Contents

- [Running it locally](#running-it-locally)
- [Setting up a new Supabase project](#setting-up-a-new-supabase-project)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [How booking works](#how-booking-works)
- [Roles and what each can do](#roles-and-what-each-can-do)
- [Design system](#design-system)
- [Operational runbook](#operational-runbook)
- [Known limitations](#known-limitations)

---

## Running it locally

Node 20 or later. Node 24 is what this was built on.

```bash
npm install
cp .env.example .env.local     # then fill it in, see below
npm run dev                    # http://localhost:3000
```

Before your first commit:

```bash
npm run prepare                # points git at .githooks
```

---

## Setting up a new Supabase project

The four migration files under `supabase/migrations/` are the whole schema.
Run them **in order**, by pasting each into the Supabase SQL editor. Every file
is safe to re-run.

| File                 | What it creates                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `0001_schema.sql`    | Four enums, twelve tables, indexes, `updated_at` triggers, two storage buckets                                   |
| `0002_rls.sql`       | Role helpers, RLS on every table, the policy set, and the grants                                                 |
| `0003_functions.sql` | Booking, availability, lookup, cancellation, audit, the doctor column guard, and the function privilege lockdown |
| `0004_seed.sql`      | Site settings, and clearly marked `SAMPLE` rows for development                                                  |

Then, in the dashboard:

1. **Authentication → Sign In / Providers → disable "Allow new users to sign
   up".** There is no public signup route, and this closes the API-level one.
2. **Confirm "Confirm email" is off**, or `tech`-created accounts with `.local`
   addresses will not be able to sign in.

Finally, create the first `tech` account. This is the one thing that cannot be
done through the portal, because there is nobody to do it yet:

```bash
node scripts/create-staff.mjs \
  --email tech1@spmhospital.local \
  --name "Full Name" \
  --role tech
```

It prints a generated password once. Write it down, hand it over in person, and
have it changed. Every account after that is created at **/portal/admin → Staff
accounts**, which writes the audit log; this script does not.

### Deleting the sample data

`0004_seed.sql` inserts rows prefixed `SAMPLE` and slugged `sample-`. Remove
them before going live using the block at the foot of that file.

---

## Environment variables

`.env.local`, never committed:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # the publishable key
# the secret key, server-only, on the next line
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://...     # canonical origin
```

Both the new-style keys (`sb_publishable_...`, `sb_secret_...`) and the legacy
JWT keys work. This project uses the new style.

**The secret key is used in exactly one file**, `src/lib/supabase/admin.ts`,
which begins with `import "server-only"` so a stray client-side import becomes
a build error rather than a key leak. It is reached only from
`/api/admin/staff`, which re-checks that the caller's own role is `tech` before
doing anything. Holding the key is not authorisation.

**The Supabase personal access token** (`sbp_...`) is a Management API
credential, not an application secret. It belongs in the operator's shell
environment for `supabase link`, and nowhere else. `.githooks/pre-commit`
blocks any commit containing one.

---

## Scripts

```bash
npm run dev               # development server
npm run build             # check:design, then next build
npm run start             # production server
npm run lint              # eslint
npm run typecheck         # tsc --noEmit
npm run format            # prettier --write

npm run check:design      # the visual rules, enforced mechanically
npm run verify:rls        # attempts forbidden reads and writes as anon
npm run test:concurrency  # 50 simultaneous bookings at a 10-seat session
npm run test:roles        # signs in as each role and tests the boundaries
npm run content:todo      # regenerates CONTENT-TODO.md
```

`check:design` runs as part of `build`, so a colour outside the palette, a
shadow, a pill radius, a third font weight, an emoji, a `console.log`, an `any`
or a UTC-derived calendar date **fails the build** rather than shipping.

`test:concurrency` and `test:roles` write to the live database and clean up
after themselves. They need the sample doctors and the test staff accounts.

---

## How booking works

Client-side counting is not acceptable, so none of it happens on the client.
Every booking, from the public form and from the reception counter alike, goes
through one `security definer` PL/pgSQL function, `public.book_appointment`,
which in a single transaction:

1. takes `pg_advisory_xact_lock` on a hash of `(doctor, date)`;
2. resolves the effective session through `resolve_session` — hospital holiday,
   then approved doctor leave or cancellation, then a `modified` or `extra`
   override, then the weekly `doctor_schedules` row;
3. applies the booking window and the same-day cutoff;
4. applies the duplicate and per-phone limits;
5. counts live appointments and refuses `SLOT_FULL` at capacity;
6. allocates `token_no` as `max(token_no) + 1` **over every row, cancelled
   included**, so a number is never reused;
7. computes `slot_time` and a `booking_ref` from an alphabet with no `I`, `O`,
   `0` or `1`;
8. inserts, and writes the audit log.

`anon` holds no privileges on `appointments` — not select, not insert. The only
four functions `anon` may execute are `book_appointment`, `get_availability`,
`lookup_appointment` and `cancel_public_appointment`.

**Verified:** 50 simultaneous bookings at a 10-seat session produce exactly 10
successes holding tokens 1 to 10 with no gaps and no duplicates, in under a
second, with all 40 refusals returning `SLOT_FULL`. A public booking and a
counter booking seconds apart draw consecutive tokens from the same sequence.

### Overrides, and who gets them

`p_override_cutoff`, `p_override_phone_limit` and `p_overflow` are honoured only
when `auth_role()` is `reception` or `tech`. A caller holding the publishable
key may send them; they are forced back to `false`. Each honoured override
writes its own audit row naming the operator.

Overflow tokens run a separate series rendered `W1`, `W2` and so on. The
uniqueness key is `(doctor_id, on_date, is_overflow, token_no)`, so a `W` token
can never collide with a normal one, and every listing orders by
`(is_overflow, token_no)` so overflow always sorts last.

---

## Roles and what each can do

|                          | anon               | doctor                       | reception                   | tech |
| ------------------------ | ------------------ | ---------------------------- | --------------------------- | ---- |
| Published reference data | read active        | read                         | read, create, edit          | full |
| Announcements            | read published     | read                         | read, create, edit, publish | full |
| Schedules                | read active        | read own                     | full                        | full |
| Exceptions               | read approved      | request own leave            | full                        | full |
| Appointments             | **none**, RPC only | read + status/remarks on own | full                        | full |
| Staff accounts           | none               | read own                     | read                        | full |
| Site settings            | read               | read                         | edit booking policy only    | full |
| Audit log                | none               | none                         | read                        | read |

Two things worth calling out:

- **A doctor may change only `status` and `doctor_remarks`.** RLS decides which
  rows; it cannot decide which columns, so a trigger
  (`appointments_doctor_guard`) does. A doctor cannot cancel — somebody has to
  telephone the patient, and that is reception's job.
- **Reception owns the booking policy.** Booking window, same-day cutoff,
  per-phone limits and the overflow toggle are editable at **/portal/reception →
  Booking rules**, because reception lives with the consequences. Contact
  numbers, the emergency line and the address are `tech` only, so they cannot
  change by accident.

Sessions expire after 12 hours, enforced in `src/middleware.ts` against
`last_sign_in_at`. Supabase's own session time-boxing is a paid feature and is
not available on this project's plan.

---

## Design system

Tokens live in `@theme` in `src/app/globals.css`; the default Tailwind palette,
shadows and radii are reset so only these exist.

- **Colour.** Navy `#0a2a5c` for chrome (top line, footer, hero), accent
  `#0f5bd6` for links and primary buttons, ink `#1b2433`, muted `#4a5568`,
  hairline `#dbe2ec`, tint `#f5f8fc` for page-head bands and alternating
  sections. Red `#c81e1e` is for emergency numbers only. Department marks have
  their own colours and appear nowhere else.
- **Type.** Plus Jakarta Sans for h1–h3 and figures, Inter for everything else,
  weights 400/600/700, self-hosted. Sizes are named by pixel (`text-15`).
- **Shape.** `rounded-sm` (6px) for controls, `rounded-md` / `.card` (10px) for
  cards, 16px for photographs. 1px borders, no shadows, no gradients.
- **Layout.** Every public page: utility line + sticky header
  (`SiteHeader`), `PageHeader` band (breadcrumb, h1, one optional line), content,
  `SiteFooter`. Shared cards: `DoctorCard`, `DepartmentTile`.
- **Copy.** One short line under a heading at most. No text that explains the
  website to the reader.

`npm run check:design` fails the build on off-palette colours, shadows,
gradients, pill radii, italic, emoji and the other mechanical rules.

---

## Operational runbook

### Add a doctor

1. **/portal/reception → Doctors → Add a doctor.** Name, department,
   designation, qualifications, room. A photograph is optional; supply a real
   one or none — there is no placeholder face.
2. **Availability → Add a weekly session** for each day they sit. Set the start
   and end time, minutes per patient, and the number of tokens.
3. The doctor appears on the public site and becomes bookable immediately.

A doctor with **no active weekly session is not bookable** and does not appear
in the booking flow, even while listed on the public site.

### Give a doctor a login

**/portal/admin → Staff accounts → Create a staff account**, role `doctor`, and
link it to the doctor record. That link is what scopes them to their own
patients. One login per doctor record.

### Mark a holiday

- **One doctor, one date:** /portal/reception → Availability → Record a change.
  Choose leave, cancelled session, changed timing or extra session.
- **The whole hospital:** Availability → Hospital closures.

A closure **does not cancel appointments already booked.** It only stops new
ones. If there are bookings, cancel each affected session so the patients get a
call.

### Cancel a session and telephone the patients

**/portal/reception → Availability → Cancel a whole session.** You are shown how
many appointments would be cancelled before you confirm. On confirming, all of
them are cancelled in one transaction and you get the call list, downloadable as
CSV. Token numbers are not reissued.

### Reset a password

**/portal/admin → Staff accounts → Reset password.** Set a new one of at least
12 characters and hand it over in person. The change is recorded in the audit
log; the password itself is not.

### Disable someone who has left

**/portal/admin → Staff accounts → Disable.** It takes effect on their **next
page load**, not at their next login: every portal layout re-reads the role from
the database on every request. You cannot disable your own account.

### Change how far ahead booking is open

**/portal/reception → Booking rules.** Also the same-day cutoff, the per-phone
limits, the online cancellation cutoff and the overflow toggle. Changes apply to
the next booking; existing bookings are untouched.

### Someone needs a slot in a full session

If `overflow_booking_enabled` is on, the counter shows **Book as overflow** once
a session is full. It needs a typed reason, issues a `W`-series token, and
writes the audit log. If it is off, the operator is told so, and the answer is
another date or another doctor.

### A parent booking for two children on one phone

The per-phone daily limit refuses the second one. The counter then offers **Book
anyway**, which needs a typed reason and is audited. The public form has no such
escape — those patients are told to telephone the desk.

### Find out who booked or cancelled something

**/portal/admin → Audit log**, filterable by date, action and person, with CSV
export. Every staff write records one row. The log is append-only: there is no
update or delete policy on it, so nobody can edit it, including `tech`.

### Counter keyboard shortcuts

`Alt+B` opens the booking screen from anywhere in the reception portal. On that
screen, `Alt+N` clears the form for the next patient, `Alt+P` reprints the last
slip, and `Enter` in the last field confirms. A whole booking can be completed
without touching the mouse.

### If the site is down

1. **Check Supabase first** — status.supabase.com, and the project dashboard.
   A paused or unhealthy project takes the whole site with it. Free-tier
   projects pause after a week of inactivity and need waking from the
   dashboard.
2. **Check the deployment** — the Vercel dashboard for the latest deployment's
   status and logs. Roll back to the previous deployment if a release broke it.
3. **Check the keys** — a rotated Supabase key that was not updated in the
   deployment's environment variables shows up as every page failing to load
   data while the site itself renders.
4. **Meanwhile, the hospital keeps working.** Reception takes appointments on
   paper and enters them when the site returns; token numbers will not match, so
   note the paper numbers separately. The public site being down does not stop
   anyone being treated.
5. **Do not restore a database backup to fix a display problem.** A restore
   loses every booking made since the backup was taken.

---

## Known limitations

Stated plainly, because they matter operationally.

- **IP rate limiting is per-instance and in-memory.** `src/lib/rate-limit.ts`
  holds its counters in process memory. On a platform running more than one
  instance the effective limit is the configured limit multiplied by the
  instance count, and every deployment resets it. It raises the cost of casual
  abuse; it is not a defence against a distributed attempt. The per-phone limits
  that actually protect capacity are enforced in Postgres, where they are exact
  and shared. Replace this with a Postgres table or Upstash Redis if it ever
  needs to be real.
- **The CSP still allows `unsafe-inline` on `script-src`,** because the App
  Router emits inline bootstrap scripts. `unsafe-eval` is refused in production.
  Moving to a per-request nonce in middleware is the remaining work.
- **The project is in `ap-northeast-1` (Tokyo).** For users in Kharagpur,
  `ap-south-1` (Mumbai) would roughly halve the round trip. A Supabase region
  cannot be changed after creation; it needs a new project and a data migration.
- **Session expiry is enforced in middleware,** not by Supabase, because
  time-boxed sessions are a paid feature. Someone holding a valid refresh token
  and bypassing the application could in principle refresh past 12 hours.
- **One active session per doctor per weekday** is enforced by a unique index.
  A doctor running genuinely separate morning and evening OPDs needs the window
  widened, or a schedule exception.
- **`lookup_appointment` is not perfectly constant-time.** It answers
  identically for a wrong reference and a wrong phone number, and is rate
  limited per address, but a determined attacker with precise timing might still
  distinguish them.

See **[CONTENT-TODO.md](./CONTENT-TODO.md)** for every fact the hospital still
has to supply. Nothing about this hospital has been invented; unsupplied values
appear on the site as a boxed placeholder.
