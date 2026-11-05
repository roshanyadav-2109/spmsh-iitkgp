"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { AppointmentSlip, type Slip } from "@/components/AppointmentSlip";
import { availabilityLabel, type AvailabilityRow } from "@/components/AvailabilityRows";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { AlertIcon, CheckIcon } from "@/components/ui/icons";
import { markFor } from "@/components/ui/departmentMark";
import { initialsOf } from "@/components/DoctorPortrait";
import { ArrowDisc } from "@/components/ui/Go";
import { departmentIcon, TASK_ICONS } from "@/lib/lineIcons";
import { StepRail } from "@/components/book/StepRail";
import { ChoiceTile } from "@/components/book/ChoiceTile";
import { DateStrip } from "@/components/book/DateStrip";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { cn } from "@/lib/cn";
import { addDays, formatDate, formatSessionClock, todayIST } from "@/lib/dates";
import { ID_REQUIRED_TYPES, PATIENT_SEXES } from "@/lib/booking/schema";
import { realPhone, tel } from "@/lib/phone";
import { StateImage } from "@/components/ui/StateImage";
import { useT } from "@/lib/i18n/I18nProvider";
import { glossIn, weekdayOf, type Dict } from "@/lib/i18n";

/**
 * The patient types, worded in the dictionary (booking.types) in the words a
 * patient uses. The stored values are unchanged; "Other" is the general
 * public and is listed first, so nobody reads the form as being for IIT
 * people only.
 */
const PATIENT_TYPE_ORDER = [
  "Other",
  "Student",
  "Staff",
  "Faculty",
  "Dependent",
] as const;

const typeLabel = (t: Dict, value: string) => t.booking.types[value] ?? value;

type Department = { id: string; name: string; slug: string };
type Doctor = {
  id: string;
  fullName: string;
  slug: string;
  designation: string | null;
  roomNo: string | null;
  departmentId: string | null;
  /** Weekdays with an active OPD session, 0 = Sunday. Display only. */
  clinicDays?: number[];
};

type Details = {
  patientName: string;
  patientAge: string;
  patientSex: string;
  patientPhone: string;
  patientType: string;
  patientIdNo: string;
  reason: string;
  consent: boolean;
  website: string;
};

const EMPTY: Details = {
  patientName: "",
  patientAge: "",
  patientSex: "",
  patientPhone: "",
  patientType: "",
  patientIdNo: "",
  reason: "",
  consent: false,
  website: "",
};

const shortDateIn = (t: Dict, iso: string) =>
  `${t.days.short[weekdayOf(iso)] ?? ""}, ${formatDate(iso)}`;

/** The illustrated icon for a department, or its SVG mark when none is drawn. */
function DepartmentGlyph({ name, size }: { name: string; size: number }) {
  const drawn = departmentIcon(name);
  if (drawn) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={drawn} alt="" width={size} height={size} className="shrink-0" />
    );
  }
  return <span className="shrink-0 text-ink">{markFor(name, size).icon}</span>;
}

export function BookingFlow({
  departments,
  doctors,
  windowDays,
  preselectedDoctorSlug,
  preselectedDepartmentSlug = null,
  slipInstructions,
  opdPhone,
  aside,
}: {
  departments: Department[];
  doctors: Doctor[];
  windowDays: number;
  preselectedDoctorSlug: string | null;
  /** /book?department=<slug>: opens step 1 filtered to it. Unknown slugs are ignored. */
  preselectedDepartmentSlug?: string | null;
  /** site_settings.slip_instructions, printed on the slip. */
  slipInstructions?: string | null;
  /** The OPD counter, offered on the confirmation for anyone who is unsure. */
  opdPhone?: string | null;
  /** Server-rendered extras under the summary (check a booking, emergency). */
  aside?: ReactNode;
}) {
  const t = useT();
  const b = t.booking;
  const shortDate = (iso: string) => shortDateIn(t, iso);
  const sexLabel = (value: string) => b.sexes[value] ?? value;

  const preselected = preselectedDoctorSlug
    ? (doctors.find((d) => d.slug === preselectedDoctorSlug) ?? null)
    : null;

  const preselectedDepartment = preselectedDepartmentSlug
    ? (departments.find((d) => d.slug === preselectedDepartmentSlug) ?? null)
    : null;

  const [departmentId, setDepartmentId] = useState<string>(
    preselected?.departmentId ?? preselectedDepartment?.id ?? "",
  );
  const [doctorId, setDoctorId] = useState<string>(preselected?.id ?? "");
  // Arriving from a department page, the department grid starts collapsed.
  const [showDepartments, setShowDepartments] = useState(!preselectedDepartment);
  const [onDate, setOnDate] = useState<string | null>(null);
  const [details, setDetails] = useState<Details>(EMPTY);
  const [step, setStep] = useState(preselected ? 2 : 1);

  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [slip, setSlip] = useState<Slip | null>(null);

  const topRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const doctor = doctors.find((d) => d.id === doctorId) ?? null;
  const department = departments.find((d) => d.id === departmentId) ?? null;
  const doctorDepartment =
    departments.find((d) => d.id === doctor?.departmentId) ?? department;

  const doctorsInDepartment = useMemo(
    () =>
      departmentId ? doctors.filter((d) => d.departmentId === departmentId) : doctors,
    [departmentId, doctors],
  );

  const loadAvailability = useCallback(
    async (id: string) => {
      setLoadingDates(true);
      const supabase = createBrowserSupabase();
      // The window is counted from today in IST, never from a UTC date.
      const from = todayIST();
      const { data } = await supabase.rpc("get_availability", {
        p_doctor_id: id,
        p_from: from,
        p_to: addDays(from, windowDays),
      });
      setAvailability((data ?? []) as AvailabilityRow[]);
      setLoadingDates(false);
    },
    [windowDays],
  );

  useEffect(() => {
    if (!doctorId) {
      setAvailability([]);
      return;
    }
    void loadAvailability(doctorId);
  }, [doctorId, loadAvailability]);

  // On each step change, focus the new step heading for keyboard and
  // screen-reader users, and bring the step indicator back into view.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (slip) return;
    stepHeadingRef.current?.focus({ preventScroll: true });
    const top = topRef.current;
    if (top && top.getBoundingClientRect().top < 0)
      top.scrollIntoView({ block: "start" });
  }, [step, slip]);

  const selectedRow = availability.find((row) => row.on_date === onDate) ?? null;
  const idRequired = ID_REQUIRED_TYPES.includes(details.patientType);

  const set = <K extends keyof Details>(key: K, value: Details[K]) => {
    setDetails((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  /** Going back to step 1 clears the date, since it belonged to that doctor. */
  const goTo = (target: number) => {
    if (target === 1) setOnDate(null);
    setStep(target);
  };

  const validateDetails = (): boolean => {
    const errors: Record<string, string> = {};
    if (details.patientName.trim().length < 2) {
      errors.patientName = b.errors.name;
    }
    const age = Number.parseInt(details.patientAge, 10);
    if (Number.isNaN(age) || age < 0 || age > 120) {
      errors.patientAge = b.errors.age;
    }
    if (!details.patientSex) errors.patientSex = b.errors.sex;
    if (!/^[6-9]\d{9}$/.test(details.patientPhone.trim())) {
      errors.patientPhone = b.errors.phone;
    }
    if (!details.patientType) errors.patientType = b.errors.type;
    if (idRequired && details.patientIdNo.trim().length === 0) {
      errors.patientIdNo = b.errors.id;
    }
    if (details.reason.length > 200) {
      errors.reason = b.errors.reason;
    }
    if (!details.consent) errors.consent = b.errors.consent;

    setFieldErrors(errors);
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      setFormError(null);
      window.setTimeout(() => {
        const el = document.getElementById(firstInvalid);
        const target =
          el?.tagName === "FIELDSET" ? el.querySelector<HTMLElement>("input") : el;
        target?.scrollIntoView({ block: "center" });
        target?.focus({ preventScroll: true });
      }, 0);
      return false;
    }
    return true;
  };

  const confirm = async () => {
    if (!doctorId || !onDate) return;
    setSubmitting(true);
    setFormError(null);

    const response = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId,
        onDate,
        patientName: details.patientName.trim(),
        patientAge: Number.parseInt(details.patientAge, 10),
        patientSex: details.patientSex,
        patientPhone: details.patientPhone.trim(),
        patientType: details.patientType,
        patientIdNo: details.patientIdNo.trim(),
        reason: details.reason.trim(),
        consent: details.consent,
        website: details.website,
      }),
    });

    const result = await response.json();
    setSubmitting(false);

    if (!result.ok) {
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        setStep(3);
      }
      setFormError(result.message ?? b.errors.failed);
      // The session may have filled while the form was open.
      if (doctorId) void loadAvailability(doctorId);
      window.setTimeout(() => errorSummaryRef.current?.focus(), 0);
      return;
    }

    setSlip({
      bookingRef: result.booking.booking_ref,
      tokenLabel: result.booking.token_label,
      slotTime: result.booking.slot_time,
      onDate: result.booking.on_date,
      isOverflow: result.booking.is_overflow,
      doctorName: doctor?.fullName ?? "",
      departmentName: doctorDepartment?.name ?? null,
      roomNo: doctor?.roomNo ?? null,
      sessionStart: selectedRow?.start_time ?? null,
      sessionEnd: selectedRow?.end_time ?? null,
      patientName: details.patientName.trim(),
      patientAge: Number.parseInt(details.patientAge, 10),
      patientSex: details.patientSex,
      patientType: details.patientType,
    });
  };

  const startAgain = () => {
    setSlip(null);
    setShowDepartments(true);
    setDepartmentId("");
    setDoctorId("");
    setOnDate(null);
    setDetails(EMPTY);
    setFieldErrors({});
    setFormError(null);
    setStep(1);
    window.scrollTo({ top: 0 });
  };

  /* ------------------------------------------------------------ confirmed */
  if (slip) {
    const opd = realPhone(opdPhone);
    return (
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Left: the confirmation and the printable slip. */}
        <div className="min-w-0 lg:col-span-8">
          <div
            className="flex flex-wrap items-center gap-x-8 gap-y-5 rounded-lg bg-tint-neutral p-6 sm:p-8"
            data-print="hide"
          >
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-ink text-white">
              <CheckIcon size={18} />
            </span>
            <div className="min-w-0 grow">
              <p className="text-15 font-medium text-ink">{b.confirmed}</p>
              <h1 className="mt-1 text-26 tracking-tighter text-ink sm:text-32">
                {b.yourToken}
              </h1>
              <p className="tnum mt-2 text-16 text-body">
                {b.dateLabel}: {shortDate(slip.onDate)}
                {slip.roomNo ? ` · ${b.roomLabel}: ${slip.roomNo}` : ""}
              </p>
            </div>
            <p className="tnum text-[72px] font-medium leading-none tracking-tight text-ink">
              {slip.tokenLabel}
            </p>
          </div>

          <div className="mt-6 rounded-lg bg-white">
            <AppointmentSlip slip={slip} instructions={slipInstructions} />
          </div>
        </div>

        {/* Right: what to do next, and the other actions. */}
        <aside className="lg:col-span-4" data-print="hide">
          <div className="rounded-lg border border-line p-6 sm:p-8">
            <h2 className="font-sans text-21 font-medium tracking-tight text-ink">
              What to do next
            </h2>
            <ol className="mt-5 grid gap-4 text-15 text-ink">
              {[b.pay, b.showScreen(slip.bookingRef), b.screenshot].map(
                (line, index) => (
                  <li key={line} className="flex gap-3">
                    <span className="tnum grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink text-13 font-medium">
                      {index + 1}
                    </span>
                    <span className="pt-0.5 leading-[1.6]">{line}</span>
                  </li>
                ),
              )}
            </ol>
          </div>

          <div className="mt-4 grid gap-3">
            <Link
              href="/appointment/status"
              className="ui-transition inline-flex h-12 items-center justify-center rounded-md bg-bar px-5 text-15 font-medium text-white no-underline hover:bg-bar-deep"
            >
              {b.checkThis}
            </Link>
            {opd ? (
              <a
                href={tel(opd)}
                className="ui-transition inline-flex h-12 items-center justify-center gap-2 rounded-md border border-ink px-5 text-15 font-medium text-ink no-underline hover:bg-tint-neutral"
              >
                {t.common.callOpd} <span className="tnum">{opd}</span>
              </a>
            ) : null}
            <button
              type="button"
              onClick={startAgain}
              className="h-11 text-15 font-medium text-ink hover:underline"
            >
              {b.anotherVisit}
            </button>
          </div>
        </aside>
      </div>
    );
  }

  /* ------------------------------------------------------------- per step */
  const heading = (title: string, helper?: ReactNode) => (
    <div>
      <h2
        id="step-heading"
        tabIndex={-1}
        data-focus-target="true"
        ref={stepHeadingRef}
        className="text-26 text-ink"
      >
        {title}
      </h2>
      {helper ? <p className="mt-1.5 text-15 text-body">{helper}</p> : null}
    </div>
  );

  const footer = ({
    back,
    hint,
    hintId,
    primary,
  }: {
    back?: ReactNode;
    hint?: string | null;
    hintId?: string;
    primary: ReactNode;
  }) => (
    // Phones: pinned to the foot of the screen, so the next step is always one
    // thumb away while the doctor list scrolls. From sm up it rides at the
    // bottom of the step card instead.
    <div className="fixed inset-x-0 bottom-0 z-30 flex flex-nowrap items-center justify-between gap-3 border-t border-line bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:sticky sm:inset-x-auto sm:z-10 sm:flex-wrap sm:rounded-b-lg sm:px-6 sm:py-3">
      <div>{back}</div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {hint ? (
          <p id={hintId} className="text-13 text-muted">
            {hint}
          </p>
        ) : null}
        {primary}
      </div>
    </div>
  );

  const backButton = (target: number, label = t.common.back) => (
    <Button variant="quiet" onClick={() => goTo(target)} disabled={submitting}>
      {label}
    </Button>
  );

  let body: ReactNode;

  if (step === 1) {
    body = (
      <>
        <div className="p-4 sm:p-6">
          {heading(b.chooseDoctor)}

          {!showDepartments && department ? (
            <div className="mt-6 flex items-center justify-between gap-3 rounded-lg bg-accent-soft px-4 py-3">
              <p className="flex min-w-0 items-center gap-3 text-15">
                <DepartmentGlyph name={department.name} size={36} />
                <span className="min-w-0">
                  <span className="block text-12 text-muted">{b.department}</span>
                  <span className="block font-medium">{department.name}</span>
                </span>
              </p>
              <Button
                variant="quiet"
                size="sm"
                onClick={() => setShowDepartments(true)}
              >
                {t.common.change}
              </Button>
            </div>
          ) : (
            <fieldset className="mt-5 min-w-0">
              <legend className="text-16 font-medium text-ink">{b.department}</legend>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <ChoiceTile
                  id="department-all"
                  name="department"
                  stacked
                  value=""
                  checked={departmentId === ""}
                  onChange={() => {
                    setDepartmentId("");
                    setDoctorId("");
                  }}
                >
                  {/* The hospital hub drawing, matching the department icons beside it. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/line/all-departments.png"
                    alt=""
                    width={40}
                    height={40}
                    className="shrink-0"
                  />
                  <span className="min-w-0 text-14 font-medium text-ink sm:text-15">
                    {t.home.allDepartments}
                  </span>
                </ChoiceTile>
                {departments.map((d) => {
                  const mark = markFor(d.name, 40);
                  return (
                    <ChoiceTile
                      key={d.id}
                      id={`department-${d.id}`}
                      name="department"
                      stacked
                      value={d.id}
                      checked={departmentId === d.id}
                      onChange={() => {
                        setDepartmentId(d.id);
                        setDoctorId("");
                      }}
                    >
                      <DepartmentGlyph name={d.name} size={40} />
                      <span className="min-w-0">
                        <span className="block text-14 font-medium leading-dense text-ink sm:text-15">
                          {d.name}
                        </span>
                        <span className="mt-0.5 block text-13 text-muted first-letter:uppercase">
                          {glossIn(t, mark.gloss)}
                        </span>
                      </span>
                    </ChoiceTile>
                  );
                })}
              </div>
            </fieldset>
          )}

          <fieldset className="mt-6 min-w-0">
            <legend className="text-16 font-medium text-ink">{b.doctor}</legend>
            {doctorsInDepartment.length === 0 ? (
              <p className="mt-3 text-14 text-muted">{b.noDoctorInDept}</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {doctorsInDepartment.map((d) => (
                  <ChoiceTile
                    key={d.id}
                    id={`doctor-${d.id}`}
                    name="doctor"
                    value={d.id}
                    checked={doctorId === d.id}
                    onChange={() => setDoctorId(d.id)}
                  >
                    <span
                      aria-hidden="true"
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-tint-neutral text-15 font-medium text-ink"
                    >
                      {initialsOf(d.fullName)}
                    </span>
                    <span className="min-w-0 grow">
                      <span className="block text-16 font-medium leading-dense text-ink">
                        {d.fullName}
                      </span>
                      {d.designation ? (
                        <span className="mt-1 block text-13 text-muted">
                          {d.designation}
                        </span>
                      ) : null}
                      {d.clinicDays && d.clinicDays.length > 0 ? (
                        <span className="mt-3 flex flex-wrap gap-1.5">
                          {d.clinicDays.map((n) => (
                            <span
                              key={n}
                              className="rounded-sm bg-accent px-2 py-0.5 text-12 font-medium text-white"
                            >
                              {t.days.short[n]}
                            </span>
                          ))}
                        </span>
                      ) : null}
                      {d.roomNo ? (
                        <span className="mt-2 block text-13 text-muted">
                          {b.room(d.roomNo)}
                        </span>
                      ) : null}
                    </span>
                  </ChoiceTile>
                ))}
              </div>
            )}
          </fieldset>
        </div>
        {footer({
          hint: doctorId ? null : b.chooseDoctorFirst,
          hintId: "step-1-hint",
          primary: (
            <Button
              variant="primary"
              disabled={!doctorId}
              aria-describedby={!doctorId ? "step-1-hint" : undefined}
              onClick={() => goTo(2)}
            >
              {t.common.continue}
            </Button>
          ),
        })}
      </>
    );
  } else if (step === 2) {
    body = (
      <>
        <div className="p-4 sm:p-6">
          {heading(b.chooseDate)}

          <div className="mt-6">
            {loadingDates ? (
              <p className="text-15 text-muted">{b.loadingDates}</p>
            ) : availability.length === 0 ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <StateImage name="no-dates" className="w-44 shrink-0" />
                <p className="text-15">{b.noDates}</p>
              </div>
            ) : (
              <>
                <DateStrip
                  rows={availability}
                  selectedDate={onDate}
                  onSelect={setOnDate}
                />
                {selectedRow ? (
                  <div className="mt-5 flex items-start gap-3 rounded-lg border border-line px-4 py-3.5 text-15">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-white">
                      <CheckIcon size={16} />
                    </span>
                    <div>
                      <p className="font-medium text-ink">
                        {shortDate(selectedRow.on_date)}
                      </p>
                      <p className="tnum mt-0.5 text-14 text-muted">
                        {selectedRow.start_time
                          ? `${t.common.opdN(formatSessionClock(selectedRow.start_time, selectedRow.end_time))} · `
                          : ""}
                        {availabilityLabel(selectedRow, t, false)}
                      </p>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
        {footer({
          back: backButton(1),
          hint: onDate ? null : b.chooseDateFirst,
          hintId: "step-2-hint",
          primary: (
            <Button
              variant="primary"
              disabled={!onDate}
              aria-describedby={!onDate ? "step-2-hint" : undefined}
              onClick={() => goTo(3)}
            >
              {t.common.continue}
            </Button>
          ),
        })}
      </>
    );
  } else if (step === 3) {
    body = (
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (validateDetails()) setStep(4);
        }}
      >
        <div className="p-4 sm:p-6">
          {heading(b.patientDetails)}

          {formError ? (
            <div
              ref={errorSummaryRef}
              tabIndex={-1}
              data-focus-target="true"
              role="alert"
              className="mt-6 flex gap-3 rounded-md border border-emergency bg-white p-4 text-15 text-emergency"
            >
              <AlertIcon size={18} className="mt-0.5 shrink-0" />
              <p>{formError}</p>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
            <Field
              id="patientName"
              label={b.patientName}
              error={fieldErrors.patientName}
              className="col-span-2"
            >
              {(control) => (
                <Input
                  {...control}
                  value={details.patientName}
                  autoComplete="name"
                  onChange={(e) => set("patientName", e.target.value)}
                />
              )}
            </Field>

            <Field id="patientAge" label={b.age} error={fieldErrors.patientAge}>
              {(control) => (
                <Input
                  {...control}
                  value={details.patientAge}
                  inputMode="numeric"
                  onChange={(e) => set("patientAge", e.target.value)}
                />
              )}
            </Field>

            <fieldset
              id="patientSex"
              aria-describedby={fieldErrors.patientSex ? "patientSex-error" : undefined}
              className="col-span-2 sm:col-span-1"
            >
              <legend className="text-13 font-medium text-ink">
                {b.patientIs}
                <span aria-hidden="true" className="ml-0.5 text-emergency">
                  *
                </span>
                <span className="sr-only"> (required)</span>
              </legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {PATIENT_SEXES.map((value) => {
                  const checked = details.patientSex === value;
                  return (
                    <label
                      key={value}
                      className={cn(
                        "ui-transition flex h-12 cursor-pointer items-center justify-center rounded-md border text-16 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                        checked
                          ? "border-accent bg-accent text-white"
                          : "border-line-strong bg-white text-ink hover:border-ink",
                      )}
                    >
                      <input
                        type="radio"
                        name="patientSex"
                        value={value}
                        checked={checked}
                        onChange={() => set("patientSex", value)}
                        className="sr-only"
                      />
                      {sexLabel(value)}
                    </label>
                  );
                })}
              </div>
              {fieldErrors.patientSex ? (
                <p id="patientSex-error" className="mt-2 text-13 text-emergency">
                  {fieldErrors.patientSex}
                </p>
              ) : null}
            </fieldset>

            <Field
              id="patientPhone"
              label={t.common.mobile}
              hint={t.common.tenDigits}
              error={fieldErrors.patientPhone}
              className="col-span-2 sm:col-span-1"
            >
              {(control) => (
                <Input
                  {...control}
                  value={details.patientPhone}
                  inputMode="numeric"
                  autoComplete="tel-national"
                  onChange={(e) => set("patientPhone", e.target.value)}
                />
              )}
            </Field>

            <Field
              id="patientType"
              label={b.whoIsPatient}
              error={fieldErrors.patientType}
              className="col-span-2 sm:col-span-1"
            >
              {(control) => (
                <Select
                  {...control}
                  value={details.patientType}
                  onChange={(e) => set("patientType", e.target.value)}
                >
                  <option value="">{b.choose}</option>
                  {PATIENT_TYPE_ORDER.map((value) => (
                    <option key={value} value={value}>
                      {typeLabel(t, value)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field
              id="patientIdNo"
              label={b.idNo}
              optional={!idRequired}
              optionalLabel={t.common.optional}
              hint={idRequired ? b.idRequired : undefined}
              error={fieldErrors.patientIdNo}
              className="col-span-2"
            >
              {(control) => (
                <Input
                  {...control}
                  value={details.patientIdNo}
                  onChange={(e) => set("patientIdNo", e.target.value)}
                />
              )}
            </Field>

            <Field
              id="reason"
              label={b.problem}
              optional
              optionalLabel={t.common.optional}
              error={fieldErrors.reason}
              className="col-span-2"
            >
              {(control) => (
                <Textarea
                  {...control}
                  value={details.reason}
                  maxLength={200}
                  onChange={(e) => set("reason", e.target.value)}
                />
              )}
            </Field>
          </div>

          {/* Honeypot: off-screen rather than display:none, so bots still fill it. */}
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="website">Leave this field empty</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              data-focus-target="true"
              autoComplete="off"
              value={details.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </div>

          <div className="mt-6 rounded-md border border-line p-4">
            <label
              htmlFor="consent"
              className="flex cursor-pointer items-start gap-3 text-14"
            >
              <input
                id="consent"
                type="checkbox"
                checked={details.consent}
                onChange={(e) => set("consent", e.target.checked)}
                aria-invalid={fieldErrors.consent ? true : undefined}
                aria-describedby={fieldErrors.consent ? "consent-error" : undefined}
                className="mt-1 h-4 w-4 shrink-0"
              />
              <span>
                {b.consent}
                <span aria-hidden="true" className="ml-0.5 text-emergency">
                  *
                </span>
              </span>
            </label>
            {fieldErrors.consent ? (
              <p id="consent-error" className="mt-2 text-13 text-emergency">
                {fieldErrors.consent}
              </p>
            ) : null}
          </div>
        </div>
        {footer({
          back: backButton(2),
          primary: (
            <Button type="submit" variant="primary">
              {b.review}
            </Button>
          ),
        })}
      </form>
    );
  } else {
    body = (
      <>
        <div className="p-4 sm:p-6">
          {heading(b.checkConfirm)}

          {formError ? (
            <div
              ref={errorSummaryRef}
              tabIndex={-1}
              data-focus-target="true"
              role="alert"
              className="mt-6 flex gap-3 rounded-md border border-navy p-4 text-15"
            >
              <AlertIcon size={18} className="mt-0.5 shrink-0 text-ink" />
              <p>{formError}</p>
            </div>
          ) : null}

          <dl className="mt-6 grid gap-x-6 gap-y-4 rounded-md border border-line p-4 text-15 sm:grid-cols-2 sm:p-5">
            <div>
              <dt className="text-13 text-muted">{b.doctor}</dt>
              <dd className="mt-0.5 font-medium">{doctor?.fullName}</dd>
              {doctorDepartment ? (
                <dd className="text-14 text-muted">{doctorDepartment.name}</dd>
              ) : null}
            </div>
            <div>
              <dt className="text-13 text-muted">{b.dateSession}</dt>
              <dd className="tnum mt-0.5 font-medium">
                {onDate ? shortDate(onDate) : ""}
              </dd>
              {selectedRow?.start_time ? (
                <dd className="tnum text-14 text-muted">
                  {formatSessionClock(selectedRow.start_time, selectedRow.end_time)}
                </dd>
              ) : null}
            </div>
            <div>
              <dt className="text-13 text-muted">{b.patient}</dt>
              <dd className="mt-0.5 font-medium">{details.patientName}</dd>
              <dd className="text-14 text-muted">
                {b.ageSex(details.patientAge, sexLabel(details.patientSex))}
              </dd>
            </div>
            <div>
              <dt className="text-13 text-muted">{b.typeMobile}</dt>
              <dd className="mt-0.5">
                {typeLabel(t, details.patientType)}
                {details.patientIdNo ? `, ${details.patientIdNo}` : ""}
              </dd>
              <dd className="tnum text-14 text-muted">{details.patientPhone}</dd>
            </div>
            {details.reason.trim() ? (
              <div className="sm:col-span-2">
                <dt className="text-13 text-muted">{b.reason}</dt>
                <dd className="mt-0.5">{details.reason.trim()}</dd>
              </div>
            ) : null}
          </dl>
        </div>
        {footer({
          back: backButton(3),
          primary: (
            <Button variant="primary" onClick={confirm} disabled={submitting}>
              {submitting ? b.confirming : b.confirm}
            </Button>
          ),
        })}
      </>
    );
  }

  /* -------------------------------------------------------------- summary */
  const summary: { label: string; value: ReactNode; detail?: string; step: number }[] =
    [
      {
        label: b.doctor,
        value: doctor?.fullName,
        detail: doctorDepartment?.name,
        step: 1,
      },
      {
        label: b.dateLabel,
        value: onDate ? shortDate(onDate) : null,
        detail: selectedRow?.start_time
          ? formatSessionClock(selectedRow.start_time, selectedRow.end_time)
          : undefined,
        step: 2,
      },
      {
        label: b.patient,
        value: step > 3 ? details.patientName : null,
        detail:
          step > 3
            ? b.ageSex(details.patientAge, sexLabel(details.patientSex))
            : undefined,
        step: 3,
      },
    ];

  return (
    <div ref={topRef} className="scroll-mt-4 pb-24 sm:pb-0">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={TASK_ICONS.book}
          alt=""
          width={56}
          height={56}
          className="hidden h-14 w-14 shrink-0 rounded-lg bg-tint p-1.5 sm:block"
        />
        <div>
          <h1 className="text-26 text-ink sm:text-32 lg:text-40">{b.title}</h1>
        </div>
      </div>

      {/* Phones and tablets: the way back to an existing booking sits up here,
          not under the whole form. From lg it is in the side column. */}
      <Link
        href="/appointment/status"
        className="ui-transition mt-4 flex items-center justify-between gap-3 rounded-lg bg-tint px-4 py-3 no-underline lg:hidden"
      >
        <span className="text-15 text-ink">
          {b.alreadyBooked}{" "}
          <span className="font-medium text-ink">{b.checkOrCancel}</span>
        </span>
        <ArrowDisc size="sm" />
      </Link>

      <div className="mt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_288px] lg:gap-6">
        <div className="min-w-0">
          <StepRail steps={b.steps} current={step} />

          {/* Below lg: the choices so far, on one line. */}
          {step > 1 && doctor ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-tint px-4 py-3 text-15 lg:hidden">
              <p className="min-w-0 truncate">
                <span className="font-medium">{doctor.fullName}</span>
                {onDate && step > 2 ? (
                  <span className="tnum text-muted"> · {shortDate(onDate)}</span>
                ) : null}
              </p>
              <Button
                variant="quiet"
                size="sm"
                onClick={() => goTo(1)}
                disabled={submitting}
              >
                {t.common.change}
              </Button>
            </div>
          ) : null}

          <section aria-labelledby="step-heading" className="card mt-4">
            {body}
          </section>
        </div>

        <aside className="mt-8 lg:mt-0">
          <div className="grid gap-4 lg:sticky lg:top-6">
            <div className="card hidden border-0 bg-tint p-6 lg:block">
              <h2 className="font-sans text-18 font-medium text-ink">
                {b.yourAppointment}
              </h2>
              <dl className="mt-4 grid gap-4">
                {summary.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <dt className="text-13 text-faint">{item.label}</dt>
                      {item.value ? (
                        <>
                          <dd className="mt-0.5 text-15 font-medium text-ink">
                            {item.value}
                          </dd>
                          {item.detail ? (
                            <dd className="tnum text-13 text-muted">{item.detail}</dd>
                          ) : null}
                        </>
                      ) : (
                        <dd className="mt-0.5 text-15 text-body">{b.notChosen}</dd>
                      )}
                    </div>
                    {item.value && step > item.step ? (
                      <Button
                        variant="quiet"
                        size="sm"
                        onClick={() => goTo(item.step)}
                        disabled={submitting}
                        aria-label={b.changeX(item.label)}
                      >
                        {t.common.change}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </dl>
            </div>
            {aside}
          </div>
        </aside>
      </div>
    </div>
  );
}
