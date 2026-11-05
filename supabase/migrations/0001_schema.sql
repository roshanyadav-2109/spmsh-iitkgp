-- =============================================================================
-- 0001_schema.sql
-- Dr. Syama Prasad Mookerjee Superspeciality Hospital, IIT Kharagpur
--
-- Run first. Safe to re-run: every object is guarded.
-- All timestamps are timestamptz; the application renders them in
-- Asia/Kolkata. Dates (on_date) are plain dates in IST by convention.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enumerated types
-- -----------------------------------------------------------------------------

do $$ begin
  create type staff_role as enum ('tech', 'reception', 'doctor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_status as enum
    ('booked', 'arrived', 'attended', 'no_show', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_source as enum ('public', 'reception');
exception when duplicate_object then null; end $$;

do $$ begin
  create type exception_type as enum ('holiday', 'cancelled', 'modified', 'extra');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Departments
-- -----------------------------------------------------------------------------

create table if not exists departments (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  location_note text,
  display_order int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Doctors
-- -----------------------------------------------------------------------------

create table if not exists doctors (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  slug            text not null unique,
  department_id   uuid references departments(id) on delete set null,
  designation     text,
  qualifications  text,
  registration_no text,
  room_no         text,
  photo_path      text,
  about           text,
  -- Who heads the department. Nobody is marked by default: the hospital has
  -- not published this, and guessing it would be an invented claim about a
  -- named person. Reception sets it at /portal/reception/doctors.
  is_department_head boolean not null default false,
  display_order   int not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

do $$ begin
  alter table doctors
    add column if not exists is_department_head boolean not null default false;
exception when others then null; end $$;

create index if not exists doctors_department_idx on doctors (department_id);

-- At most one head per department.
create unique index if not exists doctors_one_head_per_department
  on doctors (department_id) where is_department_head;

-- -----------------------------------------------------------------------------
-- Staff profiles. One row per auth.users row. There is no public signup:
-- accounts are created only by `tech` through the admin panel.
-- -----------------------------------------------------------------------------

create table if not exists staff_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  role       staff_role not null,
  -- restrict, not set null: a doctor account must always point at a doctor
  -- row (staff_doctor_link below), so nulling it on delete would leave the
  -- account in a state the table forbids. Deleting a doctor who still has a
  -- login is refused outright; unlink or change the account first. In normal
  -- use doctors are deactivated, never deleted.
  doctor_id  uuid references doctors(id) on delete restrict,
  phone      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  -- A doctor login must point at a doctors row; nothing else may.
  constraint staff_doctor_link check (
    (role = 'doctor' and doctor_id is not null)
    or (role <> 'doctor' and doctor_id is null)
  )
);

create unique index if not exists staff_profiles_doctor_unique
  on staff_profiles (doctor_id) where doctor_id is not null;

-- -----------------------------------------------------------------------------
-- Recurring weekly OPD sessions
-- -----------------------------------------------------------------------------

create table if not exists doctor_schedules (
  id           uuid primary key default gen_random_uuid(),
  doctor_id    uuid not null references doctors(id) on delete cascade,
  weekday      smallint not null check (weekday between 0 and 6),  -- 0 = Sunday
  start_time   time not null,
  end_time     time not null check (end_time > start_time),
  slot_minutes int not null default 10 check (slot_minutes between 5 and 60),
  max_patients int not null check (max_patients between 1 and 200),
  room_no      text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- One active session per doctor per weekday. Capacity resolution reads a
-- single row per (doctor, weekday), so this enforces the assumption rather
-- than letting a second row silently halve the capacity that gets applied.
-- A doctor running separate morning and evening OPDs needs the window widened
-- or a schedule exception, not a second row.
create unique index if not exists doctor_schedules_one_per_weekday
  on doctor_schedules (doctor_id, weekday) where is_active;

-- -----------------------------------------------------------------------------
-- Per-date overrides: leave, cancelled session, changed timing, extra session.
--
-- approved_at is null while a doctor's leave request is pending. Capacity
-- resolution ignores unapproved rows, so a doctor cannot cancel patients
-- directly -- reception approves, and reception gets the call list.
-- -----------------------------------------------------------------------------

create table if not exists schedule_exceptions (
  id           uuid primary key default gen_random_uuid(),
  doctor_id    uuid not null references doctors(id) on delete cascade,
  on_date      date not null,
  kind         exception_type not null,
  start_time   time,
  end_time     time,
  max_patients int check (max_patients between 1 and 200),
  reason       text,
  created_by   uuid references staff_profiles(id) on delete set null,
  approved_by  uuid references staff_profiles(id) on delete set null,
  approved_at  timestamptz,
  created_at   timestamptz not null default now(),
  unique (doctor_id, on_date, kind),
  -- A changed or extra session must say when it runs.
  constraint exception_timing check (
    kind in ('holiday', 'cancelled')
    or (start_time is not null and end_time is not null and end_time > start_time)
  )
);

create index if not exists schedule_exceptions_lookup_idx
  on schedule_exceptions (doctor_id, on_date);

create index if not exists schedule_exceptions_pending_idx
  on schedule_exceptions (on_date) where approved_at is null;

-- -----------------------------------------------------------------------------
-- Hospital-wide closures
-- -----------------------------------------------------------------------------

create table if not exists hospital_holidays (
  on_date    date primary key,
  reason     text not null,
  created_by uuid references staff_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Appointments
--
-- Normal tokens are 1..N. Overflow tokens are a separate series rendered W1,
-- W2, ... so they can never collide with a normal token; the uniqueness key
-- includes is_overflow, and every listing orders by (is_overflow, token_no)
-- so overflow always sorts last.
--
-- Tokens are never reused. Cancelling frees capacity but not the number.
-- -----------------------------------------------------------------------------

create table if not exists appointments (
  id                uuid primary key default gen_random_uuid(),
  booking_ref       text not null unique
                      check (booking_ref ~ '^SPM-[A-HJ-NP-Z2-9]{6}$'),
  doctor_id         uuid not null references doctors(id) on delete restrict,
  on_date           date not null,
  token_no          int not null check (token_no > 0),
  is_overflow       boolean not null default false,
  token_label       text generated always as (
                      case when is_overflow
                        then 'W' || token_no::text
                        else token_no::text
                      end
                    ) stored,
  slot_time         time,
  patient_name      text not null check (length(btrim(patient_name)) between 2 and 120),
  patient_age       int not null check (patient_age between 0 and 120),
  patient_sex       text not null check (patient_sex in ('Male', 'Female', 'Other')),
  -- 'REDACTED' is permitted so the data-minimisation job in /portal/admin can
  -- strip contact details from old appointments while keeping the clinical
  -- record of who was seen and when.
  patient_phone     text not null
                      check (patient_phone ~ '^[6-9][0-9]{9}$'
                             or patient_phone = 'REDACTED'),
  contact_purged_at timestamptz,
  patient_type      text not null
                      check (patient_type in
                        ('Student', 'Staff', 'Faculty', 'Dependent', 'Other')),
  patient_id_no     text,
  reason            text check (reason is null or length(reason) <= 200),
  status            appointment_status not null default 'booked',
  source            booking_source not null default 'public',
  booked_over_phone boolean not null default false,
  created_by        uuid references staff_profiles(id) on delete set null,
  doctor_remarks    text,
  cancel_reason     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (doctor_id, on_date, is_overflow, token_no),

  -- Roll number / employee number is required for Student, Staff and Faculty.
  -- Dependants and visitors often have none.
  constraint patient_id_required check (
    patient_type in ('Dependent', 'Other')
    or (patient_id_no is not null and length(btrim(patient_id_no)) > 0)
  ),

  -- A cancellation must say why.
  constraint cancel_reason_present check (
    status <> 'cancelled' or (cancel_reason is not null and btrim(cancel_reason) <> '')
  )
);

-- Applied to databases created before doctor_id became restrict.
do $$ begin
  alter table staff_profiles drop constraint if exists staff_profiles_doctor_id_fkey;
  alter table staff_profiles add constraint staff_profiles_doctor_id_fkey
    foreign key (doctor_id) references doctors(id) on delete restrict;
exception when others then null; end $$;

-- Applied to databases created before the data-minimisation job existed.
do $$ begin
  alter table appointments add column if not exists contact_purged_at timestamptz;
  alter table appointments drop constraint if exists appointments_patient_phone_check;
  alter table appointments add constraint appointments_patient_phone_check
    check (patient_phone ~ '^[6-9][0-9]{9}$' or patient_phone = 'REDACTED');
exception when others then null; end $$;

create index if not exists appointments_date_doctor_idx on appointments (on_date, doctor_id);
create index if not exists appointments_phone_date_idx  on appointments (patient_phone, on_date);
create index if not exists appointments_ref_idx         on appointments (booking_ref);
create index if not exists appointments_created_by_idx  on appointments (created_by, on_date);

-- Capacity counting hits this constantly.
create index if not exists appointments_live_idx
  on appointments (doctor_id, on_date) where status <> 'cancelled';

-- -----------------------------------------------------------------------------
-- Announcements
-- -----------------------------------------------------------------------------

create table if not exists announcements (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  body            text not null,            -- markdown, sanitised on render
  category        text,
  attachment_path text,
  is_pinned       boolean not null default false,
  is_published    boolean not null default false,
  published_at    timestamptz,
  created_by      uuid references staff_profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists announcements_public_idx
  on announcements (is_pinned desc, published_at desc) where is_published;

-- -----------------------------------------------------------------------------
-- Administration directory
-- -----------------------------------------------------------------------------

create table if not exists administration (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null,
  designation    text not null,
  qualifications text,
  email          text,
  phone          text,
  photo_path     text,
  display_order  int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Services and facilities
-- -----------------------------------------------------------------------------

create table if not exists services (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  department_id uuid references departments(id) on delete set null,
  description   text,
  timings       text,
  display_order int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Editable site content and booking policy
-- -----------------------------------------------------------------------------

create table if not exists site_settings (
  key        text primary key,
  value      text not null,
  label      text not null,
  -- Reception may edit the booking policy keys; contact details are tech only.
  is_booking_policy boolean not null default false,
  updated_by uuid references staff_profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Audit log. Every staff write records one row.
-- -----------------------------------------------------------------------------

create table if not exists audit_log (
  id         bigserial primary key,
  actor_id   uuid references staff_profiles(id) on delete set null,
  actor_role staff_role,
  action     text not null,
  entity     text not null,
  entity_id  text,
  meta       jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_idx on audit_log (created_at desc);
create index if not exists audit_log_actor_idx   on audit_log (actor_id, created_at desc);
create index if not exists audit_log_entity_idx  on audit_log (entity, entity_id);

-- -----------------------------------------------------------------------------
-- updated_at maintenance
-- -----------------------------------------------------------------------------

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists appointments_set_updated_at on appointments;
create trigger appointments_set_updated_at
  before update on appointments
  for each row execute function set_updated_at();

drop trigger if exists announcements_set_updated_at on announcements;
create trigger announcements_set_updated_at
  before update on announcements
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Storage buckets. Both are public-read: doctor photographs and announcement
-- attachments are published material. Writes are policy-controlled in 0002.
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('doctor-photos', 'doctor-photos', true, 2097152,
   array['image/jpeg', 'image/png', 'image/webp']),
  ('announcement-files', 'announcement-files', true, 10485760,
   array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
