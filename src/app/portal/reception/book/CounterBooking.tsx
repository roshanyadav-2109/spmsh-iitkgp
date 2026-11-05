"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppointmentSlip, type Slip } from "@/components/AppointmentSlip";
import { availabilityLabel, type AvailabilityRow } from "@/components/AvailabilityRows";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/cn";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { addDays, formatDate, todayIST, weekdayName } from "@/lib/dates";
import { ID_REQUIRED_TYPES, PATIENT_SEXES, PATIENT_TYPES } from "@/lib/booking/schema";

export type CounterDoctor = {
  id: string;
  fullName: string;
  designation: string | null;
  roomNo: string | null;
  departmentId: string | null;
  departmentName: string;
};

type Form = {
  phone: string;
  name: string;
  age: string;
  sex: string;
  type: string;
  idNo: string;
  reason: string;
  doctorId: string;
  onDate: string;
  overPhone: boolean;
};

const EMPTY: Form = {
  phone: "",
  name: "",
  age: "",
  sex: "",
  type: "",
  idNo: "",
  reason: "",
  doctorId: "",
  onDate: "",
  overPhone: false,
};

type Suggestion = {
  patient_name: string;
  patient_age: number;
  patient_sex: string;
  patient_type: string;
  patient_id_no: string | null;
};

/**
 * The reception counter.
 *
 * Not a reskin of the public flow. The operator is trained, repeats this two
 * hundred times a day, and must never have to reach for the mouse: everything
 * is on one screen, the tab order runs straight down the form, Enter in the
 * last field confirms, and the availability panel on the right updates the
 * moment a doctor is chosen.
 *
 * It calls the same `book_appointment` function as the public form, so
 * capacity, locking and the token sequence are identical. Only the permissions
 * and the ergonomics differ.
 */
export function CounterBooking({
  doctors,
  windowDays,
  overflowEnabled,
  perPhoneDailyLimit,
  bookedTodayInitial,
  operatorName,
  slipInstructions,
}: {
  doctors: CounterDoctor[];
  windowDays: number;
  overflowEnabled: boolean;
  perPhoneDailyLimit: number;
  bookedTodayInitial: number;
  operatorName: string;
  /** site_settings.slip_instructions, printed on the slip. */
  slipInstructions?: string | null;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [sameDayCount, setSameDayCount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [slip, setSlip] = useState<Slip | null>(null);
  const [lastSlip, setLastSlip] = useState<Slip | null>(null);
  const [bookedToday, setBookedToday] = useState(bookedTodayInitial);
  const [overrideReason, setOverrideReason] = useState("");
  const [needOverride, setNeedOverride] = useState<"none" | "phone_limit" | "overflow">(
    "none",
  );

  const phoneRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);

  const today = todayIST();
  const doctor = doctors.find((d) => d.id === form.doctorId) ?? null;
  const selectedRow = availability.find((row) => row.on_date === form.onDate) ?? null;
  const idRequired = ID_REQUIRED_TYPES.includes(form.type);

  const grouped = useMemo(() => {
    const map = new Map<string, CounterDoctor[]>();
    for (const d of doctors) {
      const list = map.get(d.departmentName) ?? [];
      list.push(d);
      map.set(d.departmentName, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [doctors]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  // ---- Availability, the moment a doctor is chosen -------------------------
  const loadAvailability = useCallback(
    async (doctorId: string) => {
      setLoadingDates(true);
      const supabase = createBrowserSupabase();
      const { data } = await supabase.rpc("get_availability", {
        p_doctor_id: doctorId,
        p_from: today,
        p_to: addDays(today, windowDays),
      });
      setAvailability((data ?? []) as AvailabilityRow[]);
      setLoadingDates(false);
    },
    [today, windowDays],
  );

  useEffect(() => {
    if (!form.doctorId) {
      setAvailability([]);
      return;
    }
    void loadAvailability(form.doctorId);
  }, [form.doctorId, loadAvailability]);

  // ---- Phone-first lookup --------------------------------------------------
  useEffect(() => {
    const phone = form.phone.trim();
    // Clear first, unconditionally. Otherwise editing the last digit of a
    // known number leaves the previous patient's details on screen next to a
    // different number, and "Use these details" fills in the wrong person.
    setSuggestion(null);
    setSameDayCount(0);
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams({ phone });
      if (form.onDate) params.set("date", form.onDate);
      const response = await fetch(`/api/reception/patient-lookup?${params}`);
      if (!response.ok || cancelled) return;
      const result = await response.json();
      if (cancelled) return;
      setSuggestion(result.patient);
      setSameDayCount(result.sameDayCount ?? 0);
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.phone, form.onDate]);

  // ---- Keyboard shortcuts --------------------------------------------------
  const clearForm = useCallback(() => {
    setForm(EMPTY);
    setErrors({});
    setNotice(null);
    setSuggestion(null);
    setSameDayCount(0);
    setSlip(null);
    setAvailability([]);
    setOverrideReason("");
    setNeedOverride("none");
    phoneRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        clearForm();
      }
      if (key === "p") {
        event.preventDefault();
        if (lastSlip) {
          setSlip(lastSlip);
          window.setTimeout(() => window.print(), 50);
        } else {
          // Silence here reads as a broken shortcut. lastSlip is component
          // state, so it is empty after any reload or navigation.
          setNotice(
            "No slip to reprint. Alt+P reprints the last booking made at this screen; find the appointment on the board to print an earlier one.",
          );
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearForm, lastSlip]);

  useEffect(() => {
    phoneRef.current?.focus();
  }, []);

  // ---- Validation and submit ----------------------------------------------
  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      next.phone = "Enter a 10-digit Indian mobile number.";
    }
    if (form.name.trim().length < 2) next.name = "Enter the patient name.";
    const age = Number.parseInt(form.age, 10);
    if (Number.isNaN(age) || age < 0 || age > 120) next.age = "Age 0 to 120.";
    if (!form.sex) next.sex = "Choose the sex.";
    if (!form.type) next.type = "Choose the patient type.";
    if (idRequired && form.idNo.trim().length === 0) {
      next.idNo = "Required for students, staff and faculty.";
    }
    if (!form.doctorId) next.doctorId = "Choose a doctor.";
    if (!form.onDate) next.onDate = "Choose a date.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /** Maps the API's Zod field names onto this form's field names. */
  const SERVER_FIELD_TO_FORM: Record<string, string> = {
    patientName: "name",
    patientAge: "age",
    patientSex: "sex",
    patientPhone: "phone",
    patientType: "type",
    patientIdNo: "idNo",
    doctorId: "doctorId",
    onDate: "onDate",
    reason: "reason",
  };

  const submit = async (options: {
    overflow?: boolean;
    overridePhoneLimit?: boolean;
  }) => {
    if (!validate()) return;
    setBusy(true);
    setNotice(null);

    let result: {
      ok?: boolean;
      code?: string;
      message?: string;
      fieldErrors?: Record<string, string>;
      booking?: {
        booking_ref: string;
        token_label: string;
        slot_time: string;
        on_date: string;
        is_overflow: boolean;
      };
    };

    // A dropped connection, a platform 502 or an HTML error page all make
    // response.json() throw. Unhandled, the operator is left with a spinner
    // and no idea whether a token was issued.
    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: form.doctorId,
          onDate: form.onDate,
          patientName: form.name.trim(),
          patientAge: Number.parseInt(form.age, 10),
          patientSex: form.sex,
          patientPhone: form.phone.trim(),
          patientType: form.type,
          patientIdNo: form.idNo.trim(),
          reason: form.reason.trim(),
          bookedOverPhone: form.overPhone,
          // Always sent. Postgres honours them only for reception and tech.
          overrideCutoff: true,
          overridePhoneLimit: options.overridePhoneLimit ?? false,
          overflow: options.overflow ?? false,
          overrideReason: overrideReason.trim(),
        }),
      });
      result = await response.json();
    } catch {
      setBusy(false);
      setNotice(
        "The booking could not be sent. Check the network, then search this phone number before trying again — the appointment may already have been created.",
      );
      if (form.doctorId) void loadAvailability(form.doctorId);
      window.setTimeout(() => noticeRef.current?.focus(), 0);
      return;
    }

    setBusy(false);

    if (!result.ok) {
      setNotice(result.message ?? "The booking could not be completed.");
      if (result.code === "SLOT_FULL" && overflowEnabled) setNeedOverride("overflow");
      else if (result.code === "RATE_LIMITED" || result.code === "DUPLICATE_BOOKING") {
        setNeedOverride("phone_limit");
      }
      if (result.fieldErrors) {
        // The API validates with the shared Zod schema, so its keys are the
        // schema's, not this form's. Unmapped, a server rejection marks no
        // field at all.
        const mapped: Record<string, string> = {};
        for (const [key, message] of Object.entries(result.fieldErrors)) {
          mapped[SERVER_FIELD_TO_FORM[key] ?? key] = message;
        }
        setErrors(mapped);
      }
      if (form.doctorId) void loadAvailability(form.doctorId);
      window.setTimeout(() => noticeRef.current?.focus(), 0);
      return;
    }

    if (!result.booking) {
      setNotice("The booking could not be completed. Try again.");
      window.setTimeout(() => noticeRef.current?.focus(), 0);
      return;
    }

    const booked: Slip = {
      bookingRef: result.booking.booking_ref,
      tokenLabel: result.booking.token_label,
      slotTime: result.booking.slot_time,
      onDate: result.booking.on_date,
      isOverflow: result.booking.is_overflow,
      doctorName: doctor?.fullName ?? "",
      departmentName: doctor?.departmentName ?? null,
      roomNo: doctor?.roomNo ?? null,
      sessionStart: selectedRow?.start_time ?? null,
      sessionEnd: selectedRow?.end_time ?? null,
      patientName: form.name.trim(),
      patientAge: Number.parseInt(form.age, 10),
      patientSex: form.sex,
      patientType: form.type,
    };

    setSlip(booked);
    setLastSlip(booked);
    setBookedToday((n) => n + 1);

    // Form clears, phone refocused, slip stays on screen until the next
    // booking begins. Nothing here disappears on a timer.
    setForm({ ...EMPTY, doctorId: form.doctorId, onDate: form.onDate });
    setSuggestion(null);
    setSameDayCount(0);
    setOverrideReason("");
    setNeedOverride("none");
    void loadAvailability(form.doctorId);
    window.setTimeout(() => {
      const printButton = printRef.current?.querySelector("button");
      if (printButton instanceof HTMLElement) printButton.focus();
      else phoneRef.current?.focus();
    }, 0);
  };

  const pastCutoff = selectedRow?.reason_code === "PAST_CUTOFF";
  const sessionFull = selectedRow?.is_full === true;

  return (
    <div className="page-width py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-26 tracking-tighter">Book an appointment</h1>
        </div>
        <p className="tnum text-15">Booked at this desk today: {bookedToday}</p>
      </div>

      <p className="mt-2 text-13 text-muted">
        Alt+N clears the form · Alt+P reprints the last slip · Enter in the last field
        confirms · Operator: {operatorName}
      </p>

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ---------------------------------------------------------- form */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit({});
          }}
          className="grid gap-5"
          noValidate
        >
          {notice ? (
            <div
              ref={noticeRef}
              tabIndex={-1}
              data-focus-target="true"
              role="alert"
              className="rounded-sm border border-navy p-3 text-14"
            >
              {notice}
            </div>
          ) : null}

          <Field
            id="phone"
            label="Mobile number"
            hint="Type the number first. A previous patient on this number is offered below."
            error={errors.phone}
          >
            {(control) => (
              <Input
                {...control}
                ref={phoneRef}
                value={form.phone}
                inputMode="numeric"
                autoComplete="off"
                onChange={(e) => set("phone", e.target.value)}
              />
            )}
          </Field>

          {suggestion ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line p-3">
              <p className="text-14">
                Last booked: {suggestion.patient_name}, {suggestion.patient_age},{" "}
                {suggestion.patient_sex}, {suggestion.patient_type}
                {suggestion.patient_id_no ? `, ${suggestion.patient_id_no}` : ""}
              </p>
              <Button
                size="sm"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    name: suggestion.patient_name,
                    age: String(suggestion.patient_age),
                    sex: suggestion.patient_sex,
                    type: suggestion.patient_type,
                    idNo: suggestion.patient_id_no ?? "",
                  }))
                }
              >
                Use these details
              </Button>
            </div>
          ) : null}

          {sameDayCount >= perPhoneDailyLimit && form.onDate ? (
            <p className="border-l-2 border-navy pl-3 text-14">
              This number already has {sameDayCount} appointments on{" "}
              {formatDate(form.onDate)}.
            </p>
          ) : null}

          <Field id="name" label="Patient name" error={errors.name}>
            {(control) => (
              <Input
                {...control}
                value={form.name}
                autoComplete="off"
                onChange={(e) => set("name", e.target.value)}
              />
            )}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field id="age" label="Age" error={errors.age}>
              {(control) => (
                <Input
                  {...control}
                  value={form.age}
                  inputMode="numeric"
                  onChange={(e) => set("age", e.target.value)}
                />
              )}
            </Field>
            <Field id="sex" label="Sex" error={errors.sex}>
              {(control) => (
                <Select
                  {...control}
                  value={form.sex}
                  onChange={(e) => set("sex", e.target.value)}
                >
                  <option value="">Choose</option>
                  {PATIENT_SEXES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field id="type" label="Patient type" error={errors.type}>
              {(control) => (
                <Select
                  {...control}
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                >
                  <option value="">Choose</option>
                  {PATIENT_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field
              id="idNo"
              label="Roll / employee no"
              optional={!idRequired}
              error={errors.idNo}
            >
              {(control) => (
                <Input
                  {...control}
                  value={form.idNo}
                  autoComplete="off"
                  onChange={(e) => set("idNo", e.target.value)}
                />
              )}
            </Field>
          </div>

          <Field id="doctorId" label="Doctor" error={errors.doctorId}>
            {(control) => (
              <Select
                {...control}
                value={form.doctorId}
                onChange={(e) => {
                  set("doctorId", e.target.value);
                  set("onDate", "");
                }}
              >
                <option value="">Choose a doctor</option>
                {grouped.map(([departmentName, list]) => (
                  <optgroup key={departmentName} label={departmentName}>
                    {list.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName}
                        {d.roomNo ? ` — Room ${d.roomNo}` : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            )}
          </Field>

          <Field
            id="onDate"
            label="Date"
            hint="Choose from the panel on the right, or type here."
            error={errors.onDate}
          >
            {(control) => (
              <Select
                {...control}
                value={form.onDate}
                onChange={(e) => set("onDate", e.target.value)}
              >
                <option value="">Choose a date</option>
                {availability.map((row) => (
                  <option
                    key={row.on_date}
                    value={row.on_date}
                    /*
                     * Reception may book past the same-day cutoff — that is
                     * what the override exists for — so a PAST_CUTOFF date
                     * must stay selectable. Only dates the desk genuinely
                     * cannot book are disabled: the doctor is not sitting, or
                     * the hospital is shut. A full session stays selectable
                     * when overflow booking is switched on.
                     */
                    disabled={
                      row.reason_code === "DOCTOR_LEAVE" ||
                      row.reason_code === "SESSION_CANCELLED" ||
                      row.reason_code === "HOSPITAL_HOLIDAY" ||
                      row.reason_code === "NO_OPD" ||
                      row.reason_code === "DATE_CLOSED" ||
                      (row.reason_code === "SLOT_FULL" && !overflowEnabled)
                    }
                  >
                    {formatDate(row.on_date)} — {availabilityLabel(row)}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field id="reason" label="Reason for the visit" optional>
            {(control) => (
              <Textarea
                {...control}
                value={form.reason}
                rows={2}
                maxLength={200}
                onChange={(e) => set("reason", e.target.value)}
              />
            )}
          </Field>

          <label htmlFor="overPhone" className="flex items-center gap-3 text-14">
            <input
              id="overPhone"
              type="checkbox"
              checked={form.overPhone}
              onChange={(e) => set("overPhone", e.target.checked)}
              className="h-4 w-4"
            />
            Booked over the telephone
          </label>

          {pastCutoff ? (
            <p className="border-l-2 border-navy pl-3 text-14">
              Booking after cutoff — will be recorded.
            </p>
          ) : null}

          {needOverride !== "none" ? (
            <Field
              id="overrideReason"
              label={
                needOverride === "overflow"
                  ? "Reason for the overflow booking"
                  : "Reason for booking anyway"
              }
              hint="Recorded in the audit log against your name."
            >
              {(control) => (
                <Input
                  {...control}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  onKeyDown={(event) => {
                    // Enter here would fire the form's default submit, which
                    // is the plain booking path — the same one that just
                    // failed. Route it to the override the operator is
                    // actually filling in a reason for.
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    if (overrideReason.trim().length === 0) return;
                    if (needOverride === "overflow") {
                      void submit({ overflow: true, overridePhoneLimit: true });
                    } else {
                      void submit({ overridePhoneLimit: true });
                    }
                  }}
                />
              )}
            </Field>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Confirming…" : "Confirm booking"}
            </Button>

            {needOverride === "phone_limit" ? (
              <Button
                disabled={busy || overrideReason.trim().length === 0}
                onClick={() => void submit({ overridePhoneLimit: true })}
              >
                Book anyway
              </Button>
            ) : null}

            {needOverride === "overflow" && overflowEnabled ? (
              <Button
                disabled={busy || overrideReason.trim().length === 0}
                onClick={() =>
                  void submit({ overflow: true, overridePhoneLimit: true })
                }
              >
                Book as overflow
              </Button>
            ) : null}

            <Button type="button" onClick={clearForm} disabled={busy}>
              Clear (Alt+N)
            </Button>
          </div>
        </form>

        {/* ------------------------------------------------- live right pane */}
        <div>
          {slip ? (
            <div ref={printRef}>
              <h2 className="text-21 tracking-tight">
                Token {slip.tokenLabel} · {formatDate(slip.onDate)}
              </h2>
              <div className="mt-4">
                <AppointmentSlip
                  slip={slip}
                  autoFocusPrint
                  instructions={slipInstructions}
                />
              </div>
              <p className="mt-3 text-13 text-muted">
                This stays on screen until the next booking is started.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-21 tracking-tight">Availability</h2>
              {!doctor ? (
                <p className="mt-4 text-15 text-muted">
                  Choose a doctor to see the next {windowDays} days.
                </p>
              ) : loadingDates ? (
                <p className="mt-4 text-15">Loading…</p>
              ) : (
                <>
                  <p className="mt-2 text-14 text-muted">
                    {doctor.fullName}
                    {doctor.roomNo ? ` · Room ${doctor.roomNo}` : ""}
                  </p>
                  <ul className="mt-4 grid gap-3">
                    {availability.map((row) => {
                      const selected = form.onDate === row.on_date;
                      return (
                        <li key={row.on_date} className="">
                          <button
                            type="button"
                            onClick={() => set("onDate", row.on_date)}
                            className={cn(
                              "ui-transition grid w-full grid-cols-[minmax(0,7rem)_minmax(0,6rem)_minmax(0,1fr)] items-baseline gap-3 px-2 py-2 text-left text-14",
                              selected && "bg-tint",
                              !row.is_open && "opacity-60",
                            )}
                          >
                            <span className="tnum">{formatDate(row.on_date)}</span>
                            <span className="text-muted">
                              {weekdayName(row.on_date).slice(0, 3)}
                            </span>
                            <span className="tnum">
                              {availabilityLabel(row)}
                              {row.is_open && row.next_token ? (
                                <span className="text-muted">
                                  {" "}
                                  · next token {row.next_token}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {sessionFull ? (
                    <p className="mt-4 border-l-2 border-navy pl-3 text-14">
                      Session full — {selectedRow?.booked} of {selectedRow?.capacity}.
                      {overflowEnabled
                        ? " Type a reason and use Book as overflow."
                        : " Overflow booking is switched off in site settings."}
                    </p>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
