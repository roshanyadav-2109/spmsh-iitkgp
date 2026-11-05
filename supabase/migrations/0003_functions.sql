-- =============================================================================
-- 0003_functions.sql
-- Booking, availability, public lookup, session cancellation, audit.
--
-- Run after 0002. Safe to re-run.
--
-- Everything a patient can do goes through four security-definer functions.
-- `anon` has no table privileges on appointments, so these are the only door.
--
-- Concurrency: book_appointment takes a transaction-scoped advisory lock keyed
-- on (doctor, date) before it reads the count. Two clients confirming in the
-- same millisecond serialise on that lock, so capacity can never be exceeded
-- and two callers can never be handed the same token.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Settings helpers
-- -----------------------------------------------------------------------------

create or replace function public.setting_int(p_key text, p_default int)
returns int
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select nullif(btrim(value), '')::int from site_settings where key = p_key),
    p_default);
$$;

create or replace function public.setting_bool(p_key text, p_default boolean)
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select lower(btrim(value)) in ('true', 't', '1', 'yes', 'on')
       from site_settings where key = p_key),
    p_default);
$$;

-- Today, in the only timezone this hospital operates in.
create or replace function public.today_ist() returns date
language sql stable set search_path = public, pg_temp as $$
  select (now() at time zone 'Asia/Kolkata')::date;
$$;

create or replace function public.now_time_ist() returns time
language sql stable set search_path = public, pg_temp as $$
  select (now() at time zone 'Asia/Kolkata')::time;
$$;

-- -----------------------------------------------------------------------------
-- resolve_session
--
-- The single source of truth for "is this doctor sitting on this date, and for
-- how many patients". Both get_availability and book_appointment call it, so
-- the counter and the public page can never disagree.
--
-- Precedence: hospital holiday > doctor leave / cancelled session >
-- modified session > extra session > the weekly schedule row.
-- Unapproved exceptions (a doctor's pending leave request) are ignored.
-- -----------------------------------------------------------------------------

create or replace function public.resolve_session(p_doctor_id uuid, p_on_date date)
returns table (
  is_open      boolean,
  reason_code  text,
  reason       text,
  start_time   time,
  end_time     time,
  slot_minutes int,
  max_patients int,
  room_no      text
)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_holiday   hospital_holidays%rowtype;
  v_block     schedule_exceptions%rowtype;
  v_change    schedule_exceptions%rowtype;
  v_weekly    doctor_schedules%rowtype;
  v_doctor    doctors%rowtype;
begin
  select * into v_doctor from doctors where id = p_doctor_id;
  if not found or not v_doctor.is_active then
    return query select false, 'DOCTOR_INACTIVE', 'Doctor not available',
                        null::time, null::time, null::int, null::int, null::text;
    return;
  end if;

  select * into v_holiday from hospital_holidays where on_date = p_on_date;
  if found then
    return query select false, 'HOSPITAL_HOLIDAY', v_holiday.reason,
                        null::time, null::time, null::int, null::int, null::text;
    return;
  end if;

  select * into v_block
    from schedule_exceptions
   where doctor_id = p_doctor_id
     and on_date = p_on_date
     and kind in ('holiday', 'cancelled')
     and approved_at is not null
   order by case kind when 'holiday' then 0 else 1 end
   limit 1;

  if found then
    return query select
      false,
      case v_block.kind when 'holiday' then 'DOCTOR_LEAVE' else 'SESSION_CANCELLED' end,
      coalesce(v_block.reason,
               case v_block.kind when 'holiday' then 'On leave' else 'Session cancelled' end),
      null::time, null::time, null::int, null::int, null::text;
    return;
  end if;

  select * into v_weekly
    from doctor_schedules
   where doctor_id = p_doctor_id
     and weekday = extract(dow from p_on_date)::smallint
     and is_active
   limit 1;

  select * into v_change
    from schedule_exceptions
   where doctor_id = p_doctor_id
     and on_date = p_on_date
     and kind in ('modified', 'extra')
     and approved_at is not null
   order by case kind when 'modified' then 0 else 1 end
   limit 1;

  -- An override supplies its own timings; anything it leaves out falls back to
  -- the weekly row, and an 'extra' session can exist with no weekly row at all.
  if v_change.id is not null then
    return query select
      true,
      'OPEN',
      v_change.reason,
      v_change.start_time,
      v_change.end_time,
      coalesce(v_weekly.slot_minutes, 10),
      coalesce(v_change.max_patients, v_weekly.max_patients,
               greatest(1, (extract(epoch from (v_change.end_time - v_change.start_time)) / 60
                            / coalesce(v_weekly.slot_minutes, 10))::int)),
      coalesce(v_weekly.room_no, v_doctor.room_no);
    return;
  end if;

  if v_weekly.id is null then
    return query select false, 'NO_OPD', 'No OPD on this day',
                        null::time, null::time, null::int, null::int, null::text;
    return;
  end if;

  return query select
    true, 'OPEN', null::text,
    v_weekly.start_time, v_weekly.end_time, v_weekly.slot_minutes,
    v_weekly.max_patients, coalesce(v_weekly.room_no, v_doctor.room_no);
end;
$$;

revoke all on function public.resolve_session(uuid, date) from public;
revoke all on function public.setting_int(text, int) from public;
revoke all on function public.setting_bool(text, boolean) from public;

-- -----------------------------------------------------------------------------
-- get_availability
--
-- One row per date in the range. Callable by anon. Returns counts and
-- capacity only -- never a patient name, never a phone number.
-- -----------------------------------------------------------------------------

create or replace function public.get_availability(
  p_doctor_id uuid,
  p_from      date,
  p_to        date
)
returns table (
  on_date      date,
  is_open      boolean,
  reason_code  text,
  reason       text,
  start_time   time,
  end_time     time,
  slot_minutes int,
  room_no      text,
  capacity     int,
  booked       int,
  next_token   int,
  is_full      boolean
)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_today       date := today_ist();
  v_now         time := now_time_ist();
  v_window      int  := setting_int('booking_window_days', 7);
  v_cutoff      int  := setting_int('same_day_cutoff_minutes', 60);
  v_last        date;
  d             date;
  s             record;
  v_booked      int;
begin
  if p_to < p_from then
    return;
  end if;
  -- Never return more than 62 rows, whatever the caller asks for.
  if p_to > p_from + 62 then
    p_to := p_from + 62;
  end if;

  v_last := v_today + v_window;

  for d in select generate_series(p_from, p_to, interval '1 day')::date loop
    select * into s from resolve_session(p_doctor_id, d);

    select count(*)::int into v_booked
      from appointments a
     where a.doctor_id = p_doctor_id
       and a.on_date = d
       and a.status <> 'cancelled'
       and not a.is_overflow;

    if d < v_today then
      return query select d, false, 'DATE_CLOSED', 'Date has passed',
                          s.start_time, s.end_time, s.slot_minutes, s.room_no,
                          coalesce(s.max_patients, 0), v_booked, null::int, false;

    elsif d > v_last then
      return query select d, false, 'DATE_CLOSED',
                          'Booking opens ' || (d - v_window)::text,
                          s.start_time, s.end_time, s.slot_minutes, s.room_no,
                          coalesce(s.max_patients, 0), v_booked, null::int, false;

    elsif not s.is_open then
      return query select d, false, s.reason_code, s.reason,
                          s.start_time, s.end_time, s.slot_minutes, s.room_no,
                          0, v_booked, null::int, false;

    elsif d = v_today and v_now > (s.end_time - make_interval(mins => v_cutoff)) then
      return query select d, false, 'PAST_CUTOFF',
                          'Same-day booking has closed for today',
                          s.start_time, s.end_time, s.slot_minutes, s.room_no,
                          s.max_patients, v_booked, null::int, v_booked >= s.max_patients;

    elsif v_booked >= s.max_patients then
      return query select d, false, 'SLOT_FULL', 'Session full',
                          s.start_time, s.end_time, s.slot_minutes, s.room_no,
                          s.max_patients, v_booked, null::int, true;

    else
      return query select d, true, 'OPEN', s.reason,
                          s.start_time, s.end_time, s.slot_minutes, s.room_no,
                          s.max_patients, v_booked,
                          (select coalesce(max(a.token_no), 0) + 1
                             from appointments a
                            where a.doctor_id = p_doctor_id
                              and a.on_date = d
                              and not a.is_overflow),
                          false;
    end if;
  end loop;
end;
$$;

revoke all on function public.get_availability(uuid, date, date) from public;
grant execute on function public.get_availability(uuid, date, date) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Booking reference generator.
-- Alphabet excludes I, O, 0 and 1 so a reference read over a telephone or
-- copied off a printed slip cannot be mistyped into a different booking.
-- -----------------------------------------------------------------------------

create or replace function public.generate_booking_ref() returns text
language plpgsql volatile set search_path = public, pg_temp as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_ref text;
  v_try int := 0;
begin
  loop
    v_ref := 'SPM-';
    for i in 1..6 loop
      v_ref := v_ref || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from appointments where booking_ref = v_ref);
    v_try := v_try + 1;
    if v_try > 40 then
      raise exception 'REF_GENERATION_FAILED';
    end if;
  end loop;
  return v_ref;
end;
$$;

revoke all on function public.generate_booking_ref() from public;

-- -----------------------------------------------------------------------------
-- book_appointment
--
-- The one way an appointment is ever created, for the public form and for the
-- reception counter alike. Same locking, same capacity, same token sequence --
-- which is what makes a public booking and a desk booking made seconds apart
-- come out as consecutive tokens.
--
-- Override flags are honoured only for reception and tech. A caller holding
-- the publishable key may set them; they are forced back to false.
--
-- Error codes: SLOT_FULL, DOCTOR_UNAVAILABLE, DATE_CLOSED, PAST_CUTOFF,
-- DUPLICATE_BOOKING, RATE_LIMITED, OVERFLOW_DISABLED, OVERFLOW_REASON_REQUIRED.
-- -----------------------------------------------------------------------------

create or replace function public.book_appointment(
  p_doctor_id            uuid,
  p_on_date              date,
  p_patient_name         text,
  p_patient_age          int,
  p_patient_sex          text,
  p_patient_phone        text,
  p_patient_type         text,
  p_patient_id_no        text    default null,
  p_reason               text    default null,
  p_booked_over_phone    boolean default false,
  p_override_cutoff      boolean default false,
  p_override_phone_limit boolean default false,
  p_overflow             boolean default false,
  p_override_reason      text    default null
)
returns table (
  booking_ref  text,
  token_no     int,
  token_label  text,
  slot_time    time,
  on_date      date,
  doctor_id    uuid,
  is_overflow  boolean
)
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare
  v_role         staff_role := auth_role();
  v_is_desk      boolean := v_role in ('reception', 'tech');
  v_actor        uuid := case when v_role is not null then auth.uid() end;
  v_source       booking_source := case when v_is_desk then 'reception' else 'public' end;
  v_today        date := today_ist();
  v_now          time := now_time_ist();
  v_window       int := setting_int('booking_window_days', 7);
  v_cutoff       int := setting_int('same_day_cutoff_minutes', 60);
  v_day_limit    int := setting_int('per_phone_daily_limit', 2);
  v_week_limit   int := setting_int('per_phone_weekly_limit', 8);
  v_overflow_on  boolean := setting_bool('overflow_booking_enabled', false);
  s              record;
  v_phone        text := btrim(p_patient_phone);
  v_name         text := btrim(p_patient_name);
  v_booked       int;
  v_token        int;
  v_slot         time;
  v_ref          text;
  v_overflow     boolean := false;
  v_day_count    int;
  v_week_count   int;
begin
  -- Overrides belong to the counter, never to the public form.
  if not v_is_desk then
    p_override_cutoff      := false;
    p_override_phone_limit := false;
    p_overflow             := false;
    p_booked_over_phone    := false;
  end if;

  if v_name is null or length(v_name) < 2 then
    raise exception 'INVALID_NAME' using detail = 'Enter the patient name.';
  end if;
  if v_phone !~ '^[6-9][0-9]{9}$' then
    raise exception 'INVALID_PHONE'
      using detail = 'Enter a 10-digit Indian mobile number.';
  end if;

  -- Serialise every booking for this doctor and date. Transaction-scoped, so
  -- it is released on commit or rollback without any explicit unlock.
  perform pg_advisory_xact_lock(
    hashtextextended(p_doctor_id::text || '|' || p_on_date::text, 0));

  -- ---- Is the session open at all? ----
  select * into s from resolve_session(p_doctor_id, p_on_date);

  if not s.is_open then
    if s.reason_code = 'HOSPITAL_HOLIDAY' then
      raise exception 'DATE_CLOSED' using detail = s.reason;
    else
      raise exception 'DOCTOR_UNAVAILABLE' using detail = s.reason;
    end if;
  end if;

  -- ---- Booking window ----
  if p_on_date < v_today then
    raise exception 'DATE_CLOSED' using detail = 'That date has passed.';
  end if;
  if p_on_date > v_today + v_window then
    raise exception 'DATE_CLOSED'
      using detail = 'Booking is open for the next ' || v_window || ' days only.';
  end if;

  -- ---- Same-day cutoff ----
  if p_on_date = v_today
     and v_now > (s.end_time - make_interval(mins => v_cutoff))
     and not p_override_cutoff then
    raise exception 'PAST_CUTOFF'
      using detail = 'Same-day booking closed at '
                     || to_char(s.end_time - make_interval(mins => v_cutoff), 'HH24:MI') || '.';
  end if;

  -- ---- Duplicate and per-phone limits ----
  if not p_override_phone_limit then
    if exists (
      select 1 from appointments a
       where a.patient_phone = v_phone
         and a.doctor_id = p_doctor_id
         and a.on_date = p_on_date
         and a.status <> 'cancelled'
    ) then
      raise exception 'DUPLICATE_BOOKING'
        using detail = 'This number already has an appointment with this doctor on this date.';
    end if;

    select count(*)::int into v_day_count
      from appointments a
     where a.patient_phone = v_phone
       and a.on_date = p_on_date
       and a.status <> 'cancelled';

    if v_day_count >= v_day_limit then
      raise exception 'RATE_LIMITED'
        using detail = 'This number already has ' || v_day_count
                       || ' appointments on that date.';
    end if;

    select count(*)::int into v_week_count
      from appointments a
     where a.patient_phone = v_phone
       and a.created_at >= now() - interval '7 days'
       and a.status <> 'cancelled';

    if v_week_count >= v_week_limit then
      raise exception 'RATE_LIMITED'
        using detail = 'This number has reached the weekly booking limit.';
    end if;
  end if;

  -- ---- Capacity ----
  select count(*)::int into v_booked
    from appointments a
   where a.doctor_id = p_doctor_id
     and a.on_date = p_on_date
     and a.status <> 'cancelled'
     and not a.is_overflow;

  if v_booked >= s.max_patients then
    if not p_overflow then
      raise exception 'SLOT_FULL'
        using detail = 'Session full - ' || v_booked || ' of ' || s.max_patients || '.';
    end if;
    if not v_overflow_on then
      raise exception 'OVERFLOW_DISABLED'
        using detail = 'Overflow booking is switched off in site settings.';
    end if;
    if p_override_reason is null or btrim(p_override_reason) = '' then
      raise exception 'OVERFLOW_REASON_REQUIRED'
        using detail = 'Type a reason for the overflow booking.';
    end if;
    v_overflow := true;
  end if;

  -- ---- Token. Never reused: the maximum is taken over every row, including
  --      cancelled ones. Overflow runs its own series so a W token can never
  --      collide with a normal one.
  select coalesce(max(a.token_no), 0) + 1 into v_token
    from appointments a
   where a.doctor_id = p_doctor_id
     and a.on_date = p_on_date
     and a.is_overflow = v_overflow;

  if v_overflow then
    v_slot := s.end_time;
  else
    v_slot := s.start_time + make_interval(mins => (v_token - 1) * s.slot_minutes);
    if v_slot > s.end_time then
      v_slot := s.end_time;
    end if;
  end if;

  v_ref := generate_booking_ref();

  insert into appointments (
    booking_ref, doctor_id, on_date, token_no, is_overflow, slot_time,
    patient_name, patient_age, patient_sex, patient_phone, patient_type,
    patient_id_no, reason, source, booked_over_phone, created_by
  ) values (
    v_ref, p_doctor_id, p_on_date, v_token, v_overflow, v_slot,
    v_name, p_patient_age, p_patient_sex, v_phone, p_patient_type,
    nullif(btrim(coalesce(p_patient_id_no, '')), ''),
    nullif(btrim(coalesce(p_reason, '')), ''),
    v_source, p_booked_over_phone, v_actor
  );

  insert into audit_log (actor_id, actor_role, action, entity, entity_id, meta)
  values (
    v_actor, v_role,
    case when v_is_desk then 'appointment.book.reception' else 'appointment.book.public' end,
    'appointments', v_ref,
    jsonb_build_object(
      'doctor_id', p_doctor_id, 'on_date', p_on_date,
      'token_no', v_token, 'is_overflow', v_overflow,
      'booked_over_phone', p_booked_over_phone)
  );

  -- Overrides are logged separately so a report can answer "who overrode what".
  if p_override_cutoff and p_on_date = v_today
     and v_now > (s.end_time - make_interval(mins => v_cutoff)) then
    insert into audit_log (actor_id, actor_role, action, entity, entity_id, meta)
    values (v_actor, v_role, 'appointment.book.cutoff_override', 'appointments', v_ref,
            jsonb_build_object('booked_at', v_now, 'cutoff_was',
                               s.end_time - make_interval(mins => v_cutoff)));
  end if;

  if p_override_phone_limit then
    insert into audit_log (actor_id, actor_role, action, entity, entity_id, meta)
    values (v_actor, v_role, 'appointment.book.phone_limit_override', 'appointments', v_ref,
            jsonb_build_object('phone', v_phone, 'reason', p_override_reason));
  end if;

  if v_overflow then
    insert into audit_log (actor_id, actor_role, action, entity, entity_id, meta)
    values (v_actor, v_role, 'appointment.book.overflow', 'appointments', v_ref,
            jsonb_build_object('capacity', s.max_patients, 'booked', v_booked,
                               'reason', p_override_reason));
  end if;

  return query
    select v_ref, v_token,
           case when v_overflow then 'W' || v_token::text else v_token::text end,
           v_slot, p_on_date, p_doctor_id, v_overflow;
end;
$$;

revoke all on function public.book_appointment(
  uuid, date, text, int, text, text, text, text, text,
  boolean, boolean, boolean, boolean, text) from public;
grant execute on function public.book_appointment(
  uuid, date, text, int, text, text, text, text, text,
  boolean, boolean, boolean, boolean, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- lookup_appointment
--
-- Reference plus phone number, matched in one indexed predicate. A wrong
-- reference and a wrong phone number are indistinguishable: both return no
-- rows, with no error and no timing branch between them, so the endpoint
-- cannot be walked to enumerate bookings.
-- -----------------------------------------------------------------------------

create or replace function public.lookup_appointment(p_ref text, p_phone text)
returns table (
  booking_ref     text,
  token_label     text,
  slot_time       time,
  on_date         date,
  status          appointment_status,
  patient_name    text,
  patient_age     int,
  patient_sex     text,
  patient_type    text,
  reason          text,
  doctor_name     text,
  department_name text,
  room_no         text,
  session_start   time,
  session_end     time,
  can_cancel      boolean,
  created_at      timestamptz
)
language sql stable security definer set search_path = public, pg_temp as $$
  select
    a.booking_ref,
    a.token_label,
    a.slot_time,
    a.on_date,
    a.status,
    a.patient_name,
    a.patient_age,
    a.patient_sex,
    a.patient_type,
    a.reason,
    d.full_name,
    dep.name,
    coalesce(s.room_no, d.room_no),
    s.start_time,
    s.end_time,
    a.status in ('booked', 'arrived')
      and (a.on_date > today_ist()
           or (a.on_date = today_ist()
               and now_time_ist() < coalesce(s.start_time, '23:59'::time)
                                    - make_interval(mins => setting_int('public_cancel_cutoff_minutes', 60)))),
    a.created_at
  from appointments a
  join doctors d on d.id = a.doctor_id
  left join departments dep on dep.id = d.department_id
  left join lateral resolve_session(a.doctor_id, a.on_date) s on true
  where a.booking_ref = upper(btrim(p_ref))
    and a.patient_phone = btrim(p_phone)
    -- purge_patient_contacts rewrites patient_phone to the literal 'REDACTED'.
    -- Without this guard, anybody who knows a reference could look the record
    -- up by sending 'REDACTED' as the phone number, which is exactly the
    -- record the purge was run to protect.
    and a.contact_purged_at is null
  limit 1;
$$;

revoke all on function public.lookup_appointment(text, text) from public;
grant execute on function public.lookup_appointment(text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- cancel_public_appointment
--
-- Frees capacity. Does not free the token number -- token allocation always
-- reads the maximum over every row, cancelled included.
-- -----------------------------------------------------------------------------

create or replace function public.cancel_public_appointment(
  p_ref    text,
  p_phone  text,
  p_reason text default null
)
returns table (booking_ref text, status appointment_status)
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare
  a       appointments%rowtype;
  s       record;
  v_ref   text := upper(btrim(p_ref));
  v_phone text := btrim(p_phone);
begin
  select * into a from appointments
   where appointments.booking_ref = v_ref
     and appointments.patient_phone = v_phone;

  -- Same response whether the reference is wrong or the phone number is.
  if not found then
    raise exception 'NOT_FOUND'
      using detail = 'No booking matches that reference and phone number.';
  end if;

  if a.status = 'cancelled' then
    raise exception 'ALREADY_CANCELLED' using detail = 'This booking is already cancelled.';
  end if;

  if a.status in ('attended', 'no_show') then
    raise exception 'CANNOT_CANCEL' using detail = 'This appointment is already closed.';
  end if;

  select * into s from resolve_session(a.doctor_id, a.on_date);

  if a.on_date < today_ist()
     or (a.on_date = today_ist()
         and s.start_time is not null
         and now_time_ist() >= s.start_time
             - make_interval(mins => setting_int('public_cancel_cutoff_minutes', 60))) then
    raise exception 'PAST_CUTOFF'
      using detail = 'This booking can no longer be cancelled online. Telephone the reception desk.';
  end if;

  update appointments
     set status = 'cancelled',
         cancel_reason = coalesce(nullif(btrim(coalesce(p_reason, '')), ''),
                                  'Cancelled by patient')
   where id = a.id;

  insert into audit_log (actor_id, actor_role, action, entity, entity_id, meta)
  values (null, null, 'appointment.cancel.public', 'appointments', v_ref,
          jsonb_build_object('doctor_id', a.doctor_id, 'on_date', a.on_date,
                             'token_no', a.token_no, 'reason', p_reason));

  return query select v_ref, 'cancelled'::appointment_status;
end;
$$;

revoke all on function public.cancel_public_appointment(text, text, text) from public;
grant execute on function public.cancel_public_appointment(text, text, text)
  to anon, authenticated;

-- -----------------------------------------------------------------------------
-- cancel_session
--
-- Reception cancels a whole session: records the exception, cancels every live
-- appointment on it, and hands back the list of people to telephone.
-- -----------------------------------------------------------------------------

create or replace function public.cancel_session(
  p_doctor_id uuid,
  p_on_date   date,
  p_reason    text
)
returns table (
  booking_ref   text,
  token_label   text,
  slot_time     time,
  patient_name  text,
  patient_phone text,
  patient_type  text
)
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare
  v_role  staff_role := auth_role();
  v_count int;
begin
  if v_role not in ('reception', 'tech') then
    raise exception 'FORBIDDEN' using detail = 'Only the reception desk may cancel a session.';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'REASON_REQUIRED' using detail = 'State why the session is cancelled.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_doctor_id::text || '|' || p_on_date::text, 0));

  insert into schedule_exceptions
    (doctor_id, on_date, kind, reason, created_by, approved_by, approved_at)
  values
    (p_doctor_id, p_on_date, 'cancelled', btrim(p_reason), auth.uid(), auth.uid(), now())
  on conflict (doctor_id, on_date, kind) do update
    set reason = excluded.reason,
        approved_by = excluded.approved_by,
        approved_at = now();

  create temporary table if not exists _cancelled_now
    (booking_ref text, token_label text, slot_time time,
     patient_name text, patient_phone text, patient_type text) on commit drop;
  delete from _cancelled_now;

  with updated as (
    update appointments a
       set status = 'cancelled',
           cancel_reason = 'Session cancelled: ' || btrim(p_reason)
     where a.doctor_id = p_doctor_id
       and a.on_date = p_on_date
       and a.status not in ('cancelled', 'attended', 'no_show')
    returning a.booking_ref, a.token_label, a.slot_time,
              a.patient_name, a.patient_phone, a.patient_type, a.is_overflow, a.token_no
  )
  insert into _cancelled_now
  select u.booking_ref, u.token_label, u.slot_time,
         u.patient_name, u.patient_phone, u.patient_type
    from updated u
   order by u.is_overflow, u.token_no;

  select count(*)::int into v_count from _cancelled_now;

  insert into audit_log (actor_id, actor_role, action, entity, entity_id, meta)
  values (auth.uid(), v_role, 'session.cancel', 'doctor_schedules',
          p_doctor_id::text,
          jsonb_build_object('on_date', p_on_date, 'reason', p_reason,
                             'appointments_cancelled', v_count));

  return query select * from _cancelled_now;
end;
$$;

revoke all on function public.cancel_session(uuid, date, text) from public;
grant execute on function public.cancel_session(uuid, date, text) to authenticated;

-- -----------------------------------------------------------------------------
-- log_audit
--
-- Called by server actions for writes that happen as plain table updates.
-- The actor is taken from the session, never from the caller's argument.
-- -----------------------------------------------------------------------------

create or replace function public.log_audit(
  p_action    text,
  p_entity    text,
  p_entity_id text default null,
  p_meta      jsonb default '{}'::jsonb
)
returns void
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v_role staff_role := auth_role();
begin
  if v_role is null then
    raise exception 'NOT_STAFF';
  end if;
  insert into audit_log (actor_id, actor_role, action, entity, entity_id, meta)
  values (auth.uid(), v_role, p_action, p_entity, p_entity_id, coalesce(p_meta, '{}'::jsonb));
end;
$$;

revoke all on function public.log_audit(text, text, text, jsonb) from public;
grant execute on function public.log_audit(text, text, text, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- Doctor column guard.
--
-- RLS decides which rows a doctor may update; it cannot decide which columns.
-- This trigger does. A doctor may set status and doctor_remarks on their own
-- patients, and nothing else. Cancelling is reception's job, because someone
-- has to telephone the patient.
-- -----------------------------------------------------------------------------

create or replace function public.appointments_doctor_guard() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_role staff_role := auth_role();
begin
  if v_role is distinct from 'doctor' then
    return new;
  end if;

  if new.booking_ref   is distinct from old.booking_ref
  or new.doctor_id     is distinct from old.doctor_id
  or new.on_date       is distinct from old.on_date
  or new.token_no      is distinct from old.token_no
  or new.is_overflow   is distinct from old.is_overflow
  or new.slot_time     is distinct from old.slot_time
  or new.patient_name  is distinct from old.patient_name
  or new.patient_age   is distinct from old.patient_age
  or new.patient_sex   is distinct from old.patient_sex
  or new.patient_phone is distinct from old.patient_phone
  or new.patient_type  is distinct from old.patient_type
  or new.patient_id_no is distinct from old.patient_id_no
  or new.reason        is distinct from old.reason
  or new.source        is distinct from old.source
  or new.created_by    is distinct from old.created_by
  or new.cancel_reason is distinct from old.cancel_reason
  or new.booked_over_phone is distinct from old.booked_over_phone
  then
    raise exception 'DOCTOR_FIELD_FORBIDDEN'
      using detail = 'A doctor may change the status and the remarks only.';
  end if;

  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    raise exception 'DOCTOR_CANNOT_CANCEL'
      using detail = 'Cancellation is done at the reception desk.';
  end if;

  return new;
end;
$$;

-- Fires before appointments_set_updated_at, which is what the alphabetical
-- trigger ordering gives us.
drop trigger if exists appointments_doctor_guard on appointments;
create trigger appointments_doctor_guard
  before update on appointments
  for each row execute function public.appointments_doctor_guard();

-- -----------------------------------------------------------------------------
-- purge_patient_contacts
--
-- Data minimisation. Removes the telephone number, the institute id number and
-- the free-text reason from appointments older than the given number of months,
-- while keeping the token, the date, the doctor and the outcome so the hospital
-- keeps its clinical and statistical record.
--
-- Irreversible. Technical support only, and audited.
-- -----------------------------------------------------------------------------

create or replace function public.purge_patient_contacts(p_months int)
returns int
language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare
  v_cutoff date;
  v_count  int;
begin
  if not is_tech() then
    raise exception 'FORBIDDEN' using detail = 'Technical support only.';
  end if;
  if p_months is null or p_months < 3 then
    raise exception 'RANGE' using detail = 'Choose 3 months or more.';
  end if;

  v_cutoff := today_ist() - (p_months || ' months')::interval;

  update appointments
     set patient_phone = 'REDACTED',
         patient_id_no = null,
         reason = null,
         contact_purged_at = now()
   where on_date < v_cutoff
     and contact_purged_at is null;

  get diagnostics v_count = row_count;

  insert into audit_log (actor_id, actor_role, action, entity, entity_id, meta)
  values (auth.uid(), auth_role(), 'data.purge_contacts', 'appointments', null,
          jsonb_build_object('months', p_months, 'cutoff', v_cutoff, 'rows', v_count));

  return v_count;
end;
$$;

-- How many rows the job would touch, so the operator sees the number first.
create or replace function public.count_purgeable_contacts(p_months int)
returns int
language sql stable security definer set search_path = public, pg_temp as $$
  select case when is_tech() then (
    select count(*)::int from appointments
     where on_date < today_ist() - (greatest(p_months, 3) || ' months')::interval
       and contact_purged_at is null
  ) else 0 end;
$$;

-- -----------------------------------------------------------------------------
-- Public aggregates for the site's live figures.
--
-- `anon` holds no privileges on appointments and must not, so these return
-- counts and nothing else: no name, no telephone number, no reference. They
-- are the only way the public pages learn how busy a day is.
-- -----------------------------------------------------------------------------

create or replace function public.opd_count(p_on_date date default null)
returns int
language sql stable security definer set search_path = public, pg_temp as $$
  select count(*)::int
    from appointments
   where on_date = coalesce(p_on_date, today_ist())
     and status <> 'cancelled';
$$;

/**
 * One row per clinic sitting on the given date, with how many tokens are gone.
 * Replaces a per-doctor call to get_availability in a loop, which was one
 * round trip per clinic.
 */
create or replace function public.clinics_on(p_on_date date default null)
returns table (
  doctor_id  uuid,
  start_time time,
  end_time   time,
  capacity   int,
  booked     int
)
language sql stable security definer set search_path = public, pg_temp as $$
  with the_date as (select coalesce(p_on_date, today_ist()) as d)
  select s.doctor_id,
         r.start_time,
         r.end_time,
         r.max_patients,
         (select count(*)::int
            from appointments a
           where a.doctor_id = s.doctor_id
             and a.on_date = (select d from the_date)
             and a.status <> 'cancelled'
             and not a.is_overflow)
    from doctor_schedules s
    join doctors doc on doc.id = s.doctor_id and doc.is_active
    cross join lateral resolve_session(s.doctor_id, (select d from the_date)) r
   where s.is_active
     and s.weekday = extract(dow from (select d from the_date))::smallint
     and r.is_open
   order by r.start_time;
$$;

-- =============================================================================
-- Function privilege lockdown.
--
-- Supabase ships default privileges that grant EXECUTE on every newly created
-- function in `public` directly to anon and authenticated. `revoke ... from
-- public` does not remove a direct role grant, so without this block anon can
-- call cancel_session, log_audit and auth_role -- all of which then rely on
-- their own internal guards as the only defence.
--
-- Revoke everything, then grant back exactly what each role needs. Trigger
-- functions are intentionally left with no grants: PostgreSQL does not check
-- EXECUTE on a trigger function.
--
-- Re-run this block after adding any function to the public schema.
-- =============================================================================

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prokind = 'f'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

-- The patient-facing surface. Four functions, and nothing else, is what the
-- publishable key can reach.
grant execute on function public.get_availability(uuid, date, date) to anon, authenticated;
grant execute on function public.lookup_appointment(text, text) to anon, authenticated;
grant execute on function public.cancel_public_appointment(text, text, text) to anon, authenticated;
grant execute on function public.book_appointment(
  uuid, date, text, int, text, text, text, text, text,
  boolean, boolean, boolean, boolean, text) to anon, authenticated;
grant execute on function public.opd_count(date) to anon, authenticated;
grant execute on function public.clinics_on(date) to anon, authenticated;

-- Staff. auth_role and friends are referenced by RLS policy expressions, which
-- are evaluated as the querying role, so authenticated must keep them.
grant execute on function public.auth_role()      to authenticated;
grant execute on function public.auth_doctor_id() to authenticated;
grant execute on function public.is_desk()        to authenticated;
grant execute on function public.is_tech()        to authenticated;
grant execute on function public.is_staff()       to authenticated;
grant execute on function public.cancel_session(uuid, date, text) to authenticated;
grant execute on function public.log_audit(text, text, text, jsonb) to authenticated;
grant execute on function public.purge_patient_contacts(int) to authenticated;
grant execute on function public.count_purgeable_contacts(int) to authenticated;
