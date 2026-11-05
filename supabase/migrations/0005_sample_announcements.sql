-- -----------------------------------------------------------------------------
-- Sample announcements, so the home page notice board has something in all
-- three of its columns.
--
-- Provenance, because it matters which of these are real:
--
--   News    - the three recruitment items are real. Their titles are taken
--             from https://spmsh.iitkgp.ac.in/announcement.php. The hospital
--             publishes a "Publish Date" and a "Last Date of Submission" for
--             each; those values could not be read from the page, so the dates
--             below are seed dates and are NOT the hospital's own.
--   Notice  - the two OPD absences and the development note are real, from
--             https://spmsh.iitkgp.ac.in/service.php.
--   Tender  - INVENTED. The hospital publishes no tenders. These exist only so
--             the Tender filter demonstrates something, and they say so in
--             their own body text.
--
-- Every row is marked in its body as seeded sample content. To clear the lot:
--
--   delete from announcements where body like 'Sample content.%';
--
-- This migration is separate from 0004_seed.sql precisely so it can be dropped
-- without disturbing the departments, doctors and services that are real.
-- -----------------------------------------------------------------------------

insert into announcements (title, slug, body, category, is_pinned, is_published, published_at)
values
  (
    'Recruitment for Visiting Consultants and Full-time Consultants',
    'recruitment-visiting-and-full-time-consultants',
    'Sample content. Seeded for demonstration and safe to delete.' || chr(10) || chr(10) ||
    'Online applications are invited for the position of Visiting Consultants or Full-time Consultants at this hospital. See the hospital''s own announcements page for the application form, the eligibility conditions and the last date of submission.',
    'News', true, true, timestamptz '2026-06-18 10:00:00+05:30'
  ),
  (
    'Recruitment for para-medical, technical, administrative and ancillary staff',
    'recruitment-paramedical-technical-administrative-staff',
    'Sample content. Seeded for demonstration and safe to delete.' || chr(10) || chr(10) ||
    'Online applications are invited for para-medical, technical, administrative and ancillary positions at this hospital. See the hospital''s own announcements page for the application form, the eligibility conditions and the last date of submission.',
    'News', false, true, timestamptz '2026-06-18 10:00:00+05:30'
  ),
  (
    'Online applications invited for faculty positions at the Medical College',
    'faculty-positions-medical-college',
    'Sample content. Seeded for demonstration and safe to delete.' || chr(10) || chr(10) ||
    'Online applications are invited for faculty positions at the Medical College.',
    'News', false, true, timestamptz '2026-05-29 10:00:00+05:30'
  ),
  (
    'Tender for supply of laboratory consumables',
    'tender-laboratory-consumables',
    'Sample content. Seeded for demonstration and safe to delete.' || chr(10) || chr(10) ||
    'This is not a real tender. The hospital has not published any tender notice. This row exists only so that the Tender filter on the home page has something to show, and it must be deleted before the site is made public.',
    'Tender', false, true, timestamptz '2026-07-09 10:00:00+05:30'
  ),
  (
    'Tender for annual maintenance of hospital equipment',
    'tender-annual-maintenance-equipment',
    'Sample content. Seeded for demonstration and safe to delete.' || chr(10) || chr(10) ||
    'This is not a real tender. The hospital has not published any tender notice. This row exists only so that the Tender filter on the home page has something to show, and it must be deleted before the site is made public.',
    'Tender', false, true, timestamptz '2026-06-02 10:00:00+05:30'
  ),
  (
    'Dr. F R Khan unavailable in OPD, 30 December to 1 January',
    'dr-f-r-khan-opd-unavailable-december',
    'Sample content. Seeded for demonstration and safe to delete.' || chr(10) || chr(10) ||
    'Dr. F R Khan will not be available in the outpatient department from 30 December 2025 to 1 January 2026.',
    'Notice', false, true, timestamptz '2025-12-22 10:00:00+05:30'
  ),
  (
    'Dr. Supriyo Pramanik unavailable in OPD on 1 January',
    'dr-supriyo-pramanik-opd-unavailable-january',
    'Sample content. Seeded for demonstration and safe to delete.' || chr(10) || chr(10) ||
    'Dr. Supriyo Pramanik will not be available in the outpatient department on 1 January 2026.',
    'Notice', false, true, timestamptz '2025-12-22 10:00:00+05:30'
  ),
  (
    'Outpatient timings and consultant days are subject to change',
    'timings-subject-to-change',
    'Sample content. Seeded for demonstration and safe to delete.' || chr(10) || chr(10) ||
    'Clinic days and outpatient timings listed on this site may change. Telephone the outpatient counter before travelling if your visit depends on a particular consultant sitting that day.',
    'Notice', false, true, timestamptz '2026-07-21 10:00:00+05:30'
  )
on conflict (slug) do nothing;
