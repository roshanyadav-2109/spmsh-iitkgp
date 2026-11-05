-- =============================================================================
-- 0002_rls.sql
-- Row level security, role helpers and grants.
--
-- Run after 0001. Safe to re-run: policies are dropped before creation.
--
-- The rule that matters most: `anon` has no access to `appointments` at all,
-- neither read nor write. Every public interaction with appointments goes
-- through the four security-definer functions in 0003.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Role helpers.
--
-- security definer so they can read staff_profiles without tripping that
-- table's own policies (which would recurse). search_path is pinned so the
-- function body cannot be redirected by a caller-controlled search path.
-- -----------------------------------------------------------------------------

create or replace function public.auth_role() returns staff_role
language sql stable security definer set search_path = public, pg_temp as $$
  select role from staff_profiles where id = auth.uid() and is_active;
$$;

create or replace function public.auth_doctor_id() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select doctor_id from staff_profiles where id = auth.uid() and is_active;
$$;

create or replace function public.is_desk() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select role in ('reception', 'tech') from staff_profiles
      where id = auth.uid() and is_active),
    false);
$$;

create or replace function public.is_tech() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select role = 'tech' from staff_profiles where id = auth.uid() and is_active),
    false);
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from staff_profiles where id = auth.uid() and is_active);
$$;

revoke all on function public.auth_role()      from public;
revoke all on function public.auth_doctor_id() from public;
revoke all on function public.is_desk()        from public;
revoke all on function public.is_tech()        from public;
revoke all on function public.is_staff()       from public;

grant execute on function public.auth_role()      to authenticated;
grant execute on function public.auth_doctor_id() to authenticated;
grant execute on function public.is_desk()        to authenticated;
grant execute on function public.is_tech()        to authenticated;
grant execute on function public.is_staff()       to authenticated;

-- -----------------------------------------------------------------------------
-- Enable RLS everywhere
-- -----------------------------------------------------------------------------

alter table departments         enable row level security;
alter table doctors             enable row level security;
alter table staff_profiles      enable row level security;
alter table doctor_schedules    enable row level security;
alter table schedule_exceptions enable row level security;
alter table hospital_holidays   enable row level security;
alter table appointments        enable row level security;
alter table announcements       enable row level security;
alter table administration      enable row level security;
alter table services            enable row level security;
alter table site_settings       enable row level security;
alter table audit_log           enable row level security;

-- -----------------------------------------------------------------------------
-- Grants. RLS only filters rows the role is already allowed to touch, so the
-- table privileges are narrowed first.
-- -----------------------------------------------------------------------------

-- Supabase's default privileges grant ALL on every newly created table in
-- `public` directly to anon and authenticated. RLS would still refuse the
-- writes, but a role should not hold a privilege it must never exercise --
-- one mistaken permissive policy would otherwise be a data loss event.
-- So: take everything away from anon first, then hand back reads only.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant select on departments, doctors, services, administration,
                announcements, doctor_schedules, schedule_exceptions,
                hospital_holidays, site_settings to anon;

-- appointments, staff_profiles and audit_log are deliberately absent above.
-- Patient data is not reachable with the publishable key by any route other
-- than the four security-definer functions in 0003.

grant select, insert, update, delete on
  departments, doctors, services, administration, announcements,
  doctor_schedules, schedule_exceptions, hospital_holidays,
  site_settings, staff_profiles to authenticated;

-- Appointments are never hard-deleted by the application: cancelling sets the
-- status and keeps the row, so the token is not reissued and the audit trail
-- survives. Withholding DELETE means a mistake at the desk cannot destroy a
-- patient record even though the desk policy is FOR ALL.
grant select, insert, update on appointments to authenticated;
revoke delete on appointments from authenticated;

grant select, insert on audit_log to authenticated;
grant usage, select on sequence audit_log_id_seq to authenticated;

-- -----------------------------------------------------------------------------
-- Published reference data: departments, doctors, services, administration
-- -----------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['departments', 'doctors', 'services', 'administration']
  loop
    execute format('drop policy if exists %I on %I', t || '_public_read', t);
    execute format('drop policy if exists %I on %I', t || '_staff_read', t);
    execute format('drop policy if exists %I on %I', t || '_desk_insert', t);
    execute format('drop policy if exists %I on %I', t || '_desk_update', t);
    execute format('drop policy if exists %I on %I', t || '_tech_delete', t);

    execute format(
      'create policy %I on %I for select to anon, authenticated using (is_active)',
      t || '_public_read', t);
    execute format(
      'create policy %I on %I for select to authenticated using (is_staff())',
      t || '_staff_read', t);
    execute format(
      'create policy %I on %I for insert to authenticated with check (is_desk())',
      t || '_desk_insert', t);
    execute format(
      'create policy %I on %I for update to authenticated using (is_desk()) with check (is_desk())',
      t || '_desk_update', t);
    execute format(
      'create policy %I on %I for delete to authenticated using (is_tech())',
      t || '_tech_delete', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Announcements: the public sees published rows only
-- -----------------------------------------------------------------------------

drop policy if exists announcements_public_read on announcements;
create policy announcements_public_read on announcements
  for select to anon, authenticated
  using (is_published and published_at is not null and published_at <= now());

drop policy if exists announcements_staff_read on announcements;
create policy announcements_staff_read on announcements
  for select to authenticated using (is_staff());

drop policy if exists announcements_desk_insert on announcements;
create policy announcements_desk_insert on announcements
  for insert to authenticated with check (is_desk());

drop policy if exists announcements_desk_update on announcements;
create policy announcements_desk_update on announcements
  for update to authenticated using (is_desk()) with check (is_desk());

drop policy if exists announcements_tech_delete on announcements;
create policy announcements_tech_delete on announcements
  for delete to authenticated using (is_tech());

-- -----------------------------------------------------------------------------
-- Doctor schedules
-- -----------------------------------------------------------------------------

drop policy if exists doctor_schedules_public_read on doctor_schedules;
create policy doctor_schedules_public_read on doctor_schedules
  for select to anon, authenticated using (is_active);

drop policy if exists doctor_schedules_own_read on doctor_schedules;
create policy doctor_schedules_own_read on doctor_schedules
  for select to authenticated
  using (is_desk() or doctor_id = auth_doctor_id());

drop policy if exists doctor_schedules_desk_write on doctor_schedules;
create policy doctor_schedules_desk_write on doctor_schedules
  for all to authenticated using (is_desk()) with check (is_desk());

-- -----------------------------------------------------------------------------
-- Schedule exceptions.
--
-- Doctors may raise a leave request for themselves but may not approve it,
-- edit it, or delete it. Reception approves and handles the patient call list.
-- -----------------------------------------------------------------------------

drop policy if exists schedule_exceptions_public_read on schedule_exceptions;
create policy schedule_exceptions_public_read on schedule_exceptions
  for select to anon, authenticated using (approved_at is not null);

drop policy if exists schedule_exceptions_staff_read on schedule_exceptions;
create policy schedule_exceptions_staff_read on schedule_exceptions
  for select to authenticated
  using (is_desk() or doctor_id = auth_doctor_id());

drop policy if exists schedule_exceptions_doctor_request on schedule_exceptions;
create policy schedule_exceptions_doctor_request on schedule_exceptions
  for insert to authenticated
  with check (
    doctor_id = auth_doctor_id()
    and kind = 'holiday'
    and approved_at is null
    and approved_by is null
  );

drop policy if exists schedule_exceptions_desk_write on schedule_exceptions;
create policy schedule_exceptions_desk_write on schedule_exceptions
  for all to authenticated using (is_desk()) with check (is_desk());

-- -----------------------------------------------------------------------------
-- Hospital holidays
-- -----------------------------------------------------------------------------

drop policy if exists hospital_holidays_public_read on hospital_holidays;
create policy hospital_holidays_public_read on hospital_holidays
  for select to anon, authenticated using (true);

drop policy if exists hospital_holidays_desk_write on hospital_holidays;
create policy hospital_holidays_desk_write on hospital_holidays
  for all to authenticated using (is_desk()) with check (is_desk());

-- -----------------------------------------------------------------------------
-- Appointments.
--
-- No anon policy exists, and anon has no table privileges either. A doctor
-- sees only their own rows. Column-level restrictions on what a doctor may
-- change are enforced by a trigger in 0003, because RLS cannot restrict
-- columns on its own.
-- -----------------------------------------------------------------------------

drop policy if exists appointments_desk_all on appointments;
create policy appointments_desk_all on appointments
  for all to authenticated using (is_desk()) with check (is_desk());

drop policy if exists appointments_doctor_read on appointments;
create policy appointments_doctor_read on appointments
  for select to authenticated
  using (doctor_id is not distinct from auth_doctor_id() and auth_doctor_id() is not null);

drop policy if exists appointments_doctor_update on appointments;
create policy appointments_doctor_update on appointments
  for update to authenticated
  using (doctor_id is not distinct from auth_doctor_id() and auth_doctor_id() is not null)
  with check (doctor_id is not distinct from auth_doctor_id() and auth_doctor_id() is not null);

-- -----------------------------------------------------------------------------
-- Staff profiles
-- -----------------------------------------------------------------------------

drop policy if exists staff_profiles_own_read on staff_profiles;
create policy staff_profiles_own_read on staff_profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists staff_profiles_desk_read on staff_profiles;
create policy staff_profiles_desk_read on staff_profiles
  for select to authenticated using (is_desk());

drop policy if exists staff_profiles_tech_write on staff_profiles;
create policy staff_profiles_tech_write on staff_profiles
  for all to authenticated using (is_tech()) with check (is_tech());

-- -----------------------------------------------------------------------------
-- Site settings.
--
-- Everyone reads them (OPD timings and the booking window are public facts).
-- Reception may change the booking policy keys, because reception is the desk
-- that lives with the consequences. Contact numbers, the emergency line and
-- the address are tech only: those must not change by accident.
-- -----------------------------------------------------------------------------

drop policy if exists site_settings_public_read on site_settings;
create policy site_settings_public_read on site_settings
  for select to anon, authenticated using (true);

drop policy if exists site_settings_reception_update on site_settings;
create policy site_settings_reception_update on site_settings
  for update to authenticated
  using (is_desk() and is_booking_policy)
  with check (is_desk() and is_booking_policy);

drop policy if exists site_settings_tech_write on site_settings;
create policy site_settings_tech_write on site_settings
  for all to authenticated using (is_tech()) with check (is_tech());

-- -----------------------------------------------------------------------------
-- Audit log. Append only: there is no update or delete policy, so RLS denies
-- both outright. An actor cannot forge a row against another actor's id.
-- -----------------------------------------------------------------------------

drop policy if exists audit_log_desk_read on audit_log;
create policy audit_log_desk_read on audit_log
  for select to authenticated using (is_desk());

drop policy if exists audit_log_staff_insert on audit_log;
create policy audit_log_staff_insert on audit_log
  for insert to authenticated
  with check (is_staff() and actor_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Storage. Both buckets are public-read published material; writes are staff
-- only. Object paths are <bucket>/<uuid>-<filename>, never patient data.
-- -----------------------------------------------------------------------------

drop policy if exists storage_hospital_public_read on storage.objects;
create policy storage_hospital_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('doctor-photos', 'announcement-files'));

drop policy if exists storage_hospital_desk_write on storage.objects;
create policy storage_hospital_desk_write on storage.objects
  for insert to authenticated
  with check (bucket_id in ('doctor-photos', 'announcement-files') and is_desk());

drop policy if exists storage_hospital_desk_update on storage.objects;
create policy storage_hospital_desk_update on storage.objects
  for update to authenticated
  using (bucket_id in ('doctor-photos', 'announcement-files') and is_desk())
  with check (bucket_id in ('doctor-photos', 'announcement-files') and is_desk());

drop policy if exists storage_hospital_desk_delete on storage.objects;
create policy storage_hospital_desk_delete on storage.objects
  for delete to authenticated
  using (bucket_id in ('doctor-photos', 'announcement-files') and is_desk());
