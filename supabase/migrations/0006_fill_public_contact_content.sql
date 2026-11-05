-- Replace only untouched PROVIDE values. This keeps any real values already
-- entered by technical support and makes the public site usable immediately.
update site_settings
set value = case key
  when 'emergency_phone' then '112'
  when 'ambulance_phone' then '108'
  when 'hospital_email' then 'No public email is listed. Please telephone the OPD counter at 03222-215306.'
  when 'emergency_location_text' then 'For an emergency, call 112 or come directly to Dr. Syama Prasad Mookerjee Superspeciality Hospital at Balarampur, IIT Kharagpur Campus.'
  when 'pharmacy_timings_text' then 'No published timings. Please confirm availability at the OPD counter: 03222-215306.'
  when 'laboratory_timings_text' then 'No published timings. Please confirm sample collection at the OPD counter: 03222-215306.'
  when 'map_embed_url' then 'https://www.google.com/maps/search/?api=1&query=Dr+Syama+Prasad+Mookerjee+Superspeciality+Hospital%2C+Balarampur%2C+IIT+Kharagpur+Campus%2C+West+Bengal+721301'
end,
updated_at = now()
where key in (
  'emergency_phone', 'ambulance_phone', 'hospital_email',
  'emergency_location_text', 'pharmacy_timings_text',
  'laboratory_timings_text', 'map_embed_url'
)
and value like '[[PROVIDE:%';
