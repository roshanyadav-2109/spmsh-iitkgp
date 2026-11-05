-- =============================================================================
-- 0004_seed.sql
-- Settings, and the hospital's real published content.
--
-- Run after 0003. Safe to re-run.
--
-- SOURCE OF EVERY FACT IN THIS FILE: https://spmsh.iitkgp.ac.in
--   name, legal entity, address, telephone numbers ... /contact.php
--   description, superspeciality scope, vision ....... /about.php
--   OPD session times, diagnostic investigations ..... /service.php
--   doctors, specialities, qualifications, timings ... /avert/Doctors Profile.pdf
--
-- Published facts are kept exact. Where the hospital has not published a
-- detail, the site uses clearly labelled guidance rather than inventing it.
--
-- ONE EXCEPTION, FLAGGED: the hospital publishes session times but not how
-- many patients each session takes. `slot_minutes` is set to 10 and
-- `max_patients` derived from the published session length (all sessions are
-- three hours, so 18). These two numbers are assumptions, not facts. They
-- control how many patients are seen per session and must be confirmed by the
-- hospital. Reception can change them at /portal/reception/availability.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Booking policy. Reception may edit these.
-- -----------------------------------------------------------------------------

insert into site_settings (key, value, label, is_booking_policy) values
  ('booking_window_days', '7',
   'Days ahead that booking is open (today plus this many)', true),
  ('same_day_cutoff_minutes', '60',
   'Same-day booking closes this many minutes before the session ends', true),
  ('per_phone_daily_limit', '2',
   'Maximum appointments per phone number on one date', true),
  ('per_phone_weekly_limit', '8',
   'Maximum appointments per phone number in a rolling seven days', true),
  ('public_cancel_cutoff_minutes', '60',
   'Online cancellation closes this many minutes before the session starts', true),
  ('overflow_booking_enabled', 'false',
   'Allow reception to issue W-series tokens once a session is full', true)
on conflict (key) do update
  set label = excluded.label,
      is_booking_policy = excluded.is_booking_policy;

-- -----------------------------------------------------------------------------
-- Contact and published content. Technical support only.
--
-- Values marked PUBLISHED come from the hospital's own site and overwrite any
-- placeholder. Values the hospital has not published stay as PROVIDE tokens
-- and are left alone if an operator has already filled them in.
-- -----------------------------------------------------------------------------

-- PUBLISHED: overwrite, because these are sourced facts.
insert into site_settings (key, value, label, is_booking_policy) values
  ('hospital_address',
   'Registered Office: Balarampur, IIT Kharagpur Campus, Dist. Paschim Medinipur, West Bengal 721301',
   'Postal address', false),
  ('reception_phone', '03222-215306',
   'Out Patient Department counter', false),
  ('front_desk_phone', '03222-215010',
   'Security front desk and OPD enquiry', false),
  ('office_phone', '03222-215014',
   'Office of SPMSH', false),
  ('opd_timings_text',
   'Forenoon 09:00-12:00. Afternoon 14:00-17:00. Individual doctors sit on set days; see each doctor profile.',
   'OPD timings, as displayed on the contact page', false)
on conflict (key) do update
  set value = excluded.value,
      label = excluded.label;

-- The official site does not publish the following hospital-specific details.
-- Use national emergency numbers and clear instructions rather than inventing
-- an email address or claiming unverified service hours.
insert into site_settings (key, value, label, is_booking_policy) values
  ('emergency_phone', '112',
   'National emergency response telephone', false),
  ('ambulance_phone', '108',
   'Ambulance telephone', false),
  ('hospital_email', 'No public email is listed. Please telephone the OPD counter at 03222-215306.',
   'Email / contact instruction', false),
  ('emergency_location_text',
   'For an emergency, call 112 or come directly to Dr. Syama Prasad Mookerjee Superspeciality Hospital at Balarampur, IIT Kharagpur Campus.',
   'Emergency location and guidance', false),
  ('pharmacy_timings_text', 'No published timings. Please confirm availability at the OPD counter: 03222-215306.',
   'Pharmacy timings', false),
  ('laboratory_timings_text',
   'No published timings. Please confirm sample collection at the OPD counter: 03222-215306.',
   'Laboratory timings', false),
  ('map_embed_url',
   'https://www.google.com/maps/search/?api=1&query=Dr+Syama+Prasad+Mookerjee+Superspeciality+Hospital%2C+Balarampur%2C+IIT+Kharagpur+Campus%2C+West+Bengal+721301',
   'Map link shown on the contact page', false),
  -- Printed on every appointment slip and shown on the home page. The wording
  -- below came from the project brief, not from the hospital: it states a
  -- reporting interval and an identity requirement that spmsh.iitkgp.ac.in
  -- does not publish. It is a setting so the hospital owns it. Clear the value
  -- to print no instruction at all.
  ('slip_instructions',
   'Report 15 minutes before your token time. Carry a photo ID.',
   'Instruction printed on the appointment slip', false)
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- Departments.
--
-- These are the OPD specialities the hospital actually runs clinics in, taken
-- from the doctors list. The superspeciality scope named on /about.php
-- (cardiothoracic surgery, surgical gastroenterology, respiratory medicine,
-- neurosurgery, transplantation, trauma, oncology) is stated on the About page
-- as published, but has no OPD roster, so it is not bookable here.
-- -----------------------------------------------------------------------------

insert into departments (name, slug, display_order) values
  ('General Medicine',            'general-medicine',        1),
  ('Paediatrics',                 'paediatrics',             2),
  ('Ophthalmology',               'ophthalmology',           3),
  ('Gynaecology and Obstetrics',  'gynaecology-obstetrics',  4),
  ('Psychiatry',                  'psychiatry',              5),
  ('Dental and Oral Surgery',     'dental-oral-surgery',     6),
  ('Facio-Maxillary Surgery',     'facio-maxillary-surgery', 7),
  ('Biochemistry',                'biochemistry',            8),
  ('Pathology',                   'pathology',               9)
on conflict (slug) do update set name = excluded.name;

-- -----------------------------------------------------------------------------
-- Doctors. Names, designations, qualifications and specialities exactly as
-- published in "Details of Doctors visiting OPD", rendered in title case.
-- -----------------------------------------------------------------------------

insert into doctors (full_name, slug, department_id, designation, qualifications, display_order)
values
  ('Dr. Nirmal Kumar Som', 'nirmal-kumar-som',
   (select id from departments where slug = 'general-medicine'),
   'Visiting Consultant, General Medicine', 'MBBS, MD (Genl. Med.)', 1),

  ('Dr. Mahasweta Chaudhuri', 'mahasweta-chaudhuri',
   (select id from departments where slug = 'paediatrics'),
   'Visiting Consultant, Paediatric', 'MBBS, DNB (Paed)', 2),

  ('Dr. Sushanta Bhanja', 'sushanta-bhanja',
   (select id from departments where slug = 'paediatrics'),
   'Visiting Consultant, Paediatric', 'MBBS, MD (Paed)', 3),

  ('Dr. Gautam Saha', 'gautam-saha',
   (select id from departments where slug = 'ophthalmology'),
   'Visiting Consultant, Ophthalmology', 'MS (Ophth.)', 4),

  ('Dr. Koushik Tripathy', 'koushik-tripathy',
   (select id from departments where slug = 'ophthalmology'),
   'Visiting Consultant, Ophthalmology', 'MBBS, MD (Ophth.), DNB (Ophth)', 5),

  ('Dr. Souvik Kumar Das', 'souvik-kumar-das',
   (select id from departments where slug = 'gynaecology-obstetrics'),
   'Visiting Consultant, Gynaecology-Obstetrics', 'MBBS, MS (Obst. & Gynae), FMAS', 6),

  ('Dr. Debabrata Majumdar', 'debabrata-majumdar',
   (select id from departments where slug = 'psychiatry'),
   'Visiting Consultant, Psychiatry', 'MD (Psychiatry), DPM, MBBS', 7),

  ('Dr. Barnali Ghosh', 'barnali-ghosh',
   (select id from departments where slug = 'dental-oral-surgery'),
   'Visiting Consultant, Dental & Oral Surgery', 'BDS (Cal), FDSRCS (London)', 8),

  ('Dr. Suman Das', 'suman-das',
   (select id from departments where slug = 'facio-maxillary-surgery'),
   'Visiting Consultant, Facio-Maxillary', 'BDS (Hons), MFDSRCS (Eng), FFDRCS (Irel)', 9),

  ('Dr. Rajarshi Sarkar', 'rajarshi-sarkar',
   (select id from departments where slug = 'biochemistry'),
   'Visiting Consultant, Biochemistry', 'MD, DNB (Biochemistry)', 10),

  ('Dr. Aditi Bhattacharjee', 'aditi-bhattacharjee',
   (select id from departments where slug = 'pathology'),
   'Visiting Consultant, Pathology', 'MBBS, MD (Pathology)', 11)
on conflict (slug) do update
  set full_name = excluded.full_name,
      department_id = excluded.department_id,
      designation = excluded.designation,
      qualifications = excluded.qualifications,
      display_order = excluded.display_order;

-- -----------------------------------------------------------------------------
-- Weekly OPD sessions.
--
-- Days and times are exactly as published. slot_minutes and max_patients are
-- the assumption flagged at the head of this file: 10 minutes per patient,
-- giving 18 tokens for a three-hour session.
--
-- weekday: 0 Sunday, 1 Monday ... 6 Saturday.
-- -----------------------------------------------------------------------------

insert into doctor_schedules
  (doctor_id, weekday, start_time, end_time, slot_minutes, max_patients)
select d.id, s.weekday, s.start_time, s.end_time, 10,
       (extract(epoch from (s.end_time - s.start_time)) / 60 / 10)::int
from (values
  -- Dr. Nirmal Kumar Som: Tuesday, Thursday 14:00-17:00
  ('nirmal-kumar-som',    2, '14:00'::time, '17:00'::time),
  ('nirmal-kumar-som',    4, '14:00'::time, '17:00'::time),
  -- Dr. Mahasweta Chaudhuri: Monday, Thursday 11:00-14:00; Friday 14:00-17:00
  ('mahasweta-chaudhuri', 1, '11:00'::time, '14:00'::time),
  ('mahasweta-chaudhuri', 4, '11:00'::time, '14:00'::time),
  ('mahasweta-chaudhuri', 5, '14:00'::time, '17:00'::time),
  -- Dr. Sushanta Bhanja: Saturday 10:00-13:00
  ('sushanta-bhanja',     6, '10:00'::time, '13:00'::time),
  -- Dr. Gautam Saha: Wednesday, Thursday 14:00-17:00
  ('gautam-saha',         3, '14:00'::time, '17:00'::time),
  ('gautam-saha',         4, '14:00'::time, '17:00'::time),
  -- Dr. Koushik Tripathy: Tuesday 09:00-12:00
  ('koushik-tripathy',    2, '09:00'::time, '12:00'::time),
  -- Dr. Souvik Kumar Das: Tuesday 09:00-12:00
  ('souvik-kumar-das',    2, '09:00'::time, '12:00'::time),
  -- Dr. Debabrata Majumdar: Monday, Saturday 09:00-12:00
  ('debabrata-majumdar',  1, '09:00'::time, '12:00'::time),
  ('debabrata-majumdar',  6, '09:00'::time, '12:00'::time),
  -- Dr. Barnali Ghosh: Wednesday, Friday 14:00-17:00
  ('barnali-ghosh',       3, '14:00'::time, '17:00'::time),
  ('barnali-ghosh',       5, '14:00'::time, '17:00'::time),
  -- Dr. Suman Das: Saturday 09:00-12:00
  ('suman-das',           6, '09:00'::time, '12:00'::time),
  -- Dr. Rajarshi Sarkar: Tuesday, Thursday 09:00-12:00
  -- (listed under "TIMMING", not "OPD TIMMING" -- see CONTENT-TODO.md)
  ('rajarshi-sarkar',     2, '09:00'::time, '12:00'::time),
  ('rajarshi-sarkar',     4, '09:00'::time, '12:00'::time),
  -- Dr. Aditi Bhattacharjee: Thursday 14:00-17:00
  -- (listed under "TIMMING", not "OPD TIMMING" -- see CONTENT-TODO.md)
  ('aditi-bhattacharjee', 4, '14:00'::time, '17:00'::time)
) as s(slug, weekday, start_time, end_time)
join doctors d on d.slug = s.slug
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Services, as published on /service.php.
-- -----------------------------------------------------------------------------

insert into services (name, slug, description, timings, display_order) values
  ('Outdoor Patient Department', 'outdoor-patient-department',
   'Consultation by appointment. Choose a doctor by day or by speciality.',
   'Forenoon 09:00-12:00. Afternoon 14:00-17:00.', 1),
  ('Laboratory investigations', 'laboratory-investigations',
   'Listed by the hospital as upcoming.', null, 2),
  ('Neuro-physiological investigations', 'neuro-physiological-investigations',
   'Listed by the hospital as upcoming.', null, 3),
  ('Ultrasonographical investigations', 'ultrasonographical-investigations',
   'Listed by the hospital as upcoming.', null, 4),
  ('Radiological investigations', 'radiological-investigations',
   'Listed by the hospital as upcoming.', null, 5),
  ('Cardiological investigations', 'cardiological-investigations',
   'Listed by the hospital as upcoming.', null, 6),
  ('Indoor Patient Department', 'indoor-patient-department',
   'Under development.', null, 7)
on conflict (slug) do update
  set name = excluded.name,
      description = excluded.description,
      timings = excluded.timings,
      display_order = excluded.display_order;

-- -----------------------------------------------------------------------------
-- Remove the sample rows shipped during development.
--
-- Runs last, after the real records exist, so a doctor login that was linked
-- to a sample record can be repointed first. A sample doctor that still has a
-- staff account linked to it is skipped rather than deleted: the foreign key
-- is `restrict`, and silently deactivating somebody's login from a migration
-- would be worse than leaving one row behind. Repoint the account at
-- /portal/admin, then re-run this file.
-- -----------------------------------------------------------------------------

delete from appointments a using doctors d
  where a.doctor_id = d.id and d.slug like 'sample-%';

delete from doctors d
  where d.slug like 'sample-%'
    and not exists (select 1 from staff_profiles s where s.doctor_id = d.id);

delete from departments   where slug like 'sample-%';
delete from services      where slug like 'sample-%';
delete from announcements where slug like 'sample-%';
delete from administration where full_name like 'SAMPLE%';

do $$
declare v_left int;
begin
  select count(*) into v_left from doctors where slug like 'sample-%';
  if v_left > 0 then
    raise notice
      'Left % sample doctor row(s) in place: a staff account is still linked. Repoint the account at /portal/admin, then re-run 0004_seed.sql.',
      v_left;
  end if;
end $$;
