"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AppointmentSlip, type Slip } from "@/components/AppointmentSlip";
import { TASK_ICONS } from "@/lib/lineIcons";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { formatDate, formatSessionClock } from "@/lib/dates";
import { StateImage } from "@/components/ui/StateImage";
import { useT } from "@/lib/i18n/I18nProvider";
import { weekdayOf } from "@/lib/i18n";

type Appointment = {
  booking_ref: string;
  token_label: string;
  slot_time: string | null;
  on_date: string;
  status: string;
  patient_name: string;
  patient_age: number;
  patient_sex: string;
  patient_type: string;
  reason: string | null;
  doctor_name: string;
  department_name: string | null;
  room_no: string | null;
  session_start: string | null;
  session_end: string | null;
  can_cancel: boolean;
};

export function StatusLookup({
  slipInstructions,
  initialRef = "",
}: {
  /** site_settings.slip_instructions, printed on the slip. */
  slipInstructions?: string | null;
  /** Filled from ?ref= when a slip's QR code is scanned. */
  initialRef?: string;
}) {
  const t = useT();
  const s = t.status;
  const [bookingRef, setBookingRef] = useState(initialRef);
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);

  const messageRef = useRef<HTMLDivElement>(null);

  const lookup = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setFieldErrors({});

    const response = await fetch("/api/appointment/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingRef: bookingRef.trim(), phone: phone.trim() }),
    });
    const result = await response.json();
    setBusy(false);

    if (!result.ok) {
      setAppointment(null);
      setFieldErrors(result.fieldErrors ?? {});
      setMessage(result.message);
      window.setTimeout(() => messageRef.current?.focus(), 0);
      return;
    }
    setAppointment(result.appointment as Appointment);
  };

  const cancel = async () => {
    setCancelError(null);
    const response = await fetch("/api/appointment/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingRef: bookingRef.trim(),
        phone: phone.trim(),
        reason: cancelReason.trim(),
      }),
    });
    const result = await response.json();

    if (!result.ok) {
      setCancelError(result.message);
      return;
    }
    setCancelOpen(false);
    setAppointment((current) =>
      current ? { ...current, status: "cancelled", can_cancel: false } : current,
    );
    setMessage(s.cancelledMsg);
  };

  const slip: Slip | null = appointment
    ? {
        bookingRef: appointment.booking_ref,
        tokenLabel: appointment.token_label,
        slotTime: appointment.slot_time,
        onDate: appointment.on_date,
        isOverflow: appointment.token_label.startsWith("W"),
        doctorName: appointment.doctor_name,
        departmentName: appointment.department_name,
        roomNo: appointment.room_no,
        sessionStart: appointment.session_start,
        sessionEnd: appointment.session_end,
        patientName: appointment.patient_name,
        patientAge: appointment.patient_age,
        patientSex: appointment.patient_sex,
        patientType: appointment.patient_type,
      }
    : null;

  return (
    <div>
      <div className="card border-0 p-4 sm:p-6">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TASK_ICONS.checkBooking}
            alt=""
            width={56}
            height={56}
            className="hidden h-14 w-14 shrink-0 rounded-lg bg-tint p-1 sm:block"
          />
          <div>
            <h1 className="text-26 text-ink sm:text-32">{s.title}</h1>
          </div>
        </div>

        <form
          onSubmit={lookup}
          className="mt-5 grid gap-4 rounded-lg bg-tint p-4 sm:grid-cols-2 sm:p-5"
          noValidate
        >
          <Field
            id="bookingRef"
            label={s.ref}
            hint={s.refHint}
            error={fieldErrors.bookingRef}
          >
            {(control) => (
              <Input
                {...control}
                value={bookingRef}
                autoComplete="off"
                spellCheck={false}
                className="tnum"
                onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
              />
            )}
          </Field>

          <Field
            id="phone"
            label={t.common.mobile}
            hint={t.common.tenDigits}
            error={fieldErrors.phone}
          >
            {(control) => (
              <Input
                {...control}
                value={phone}
                inputMode="numeric"
                autoComplete="tel-national"
                className="tnum"
                onChange={(e) => setPhone(e.target.value)}
              />
            )}
          </Field>

          <div className="sm:col-span-2">
            <Button
              type="submit"
              variant="primary"
              disabled={busy}
              className="h-12 w-full text-16 sm:w-auto sm:px-8"
            >
              {busy ? s.checking : s.find}
            </Button>
          </div>
        </form>

        {message ? (
          <div
            ref={messageRef}
            tabIndex={-1}
            data-focus-target="true"
            role="status"
            aria-live="polite"
            className="mt-4 flex flex-col gap-4 rounded-lg bg-accent-soft p-4 text-15 text-ink sm:flex-row sm:items-center"
          >
            <StateImage
              name={message === s.cancelledMsg ? "cancelled" : "booking-not-found"}
              className="w-40 shrink-0"
            />
            <p>{message}</p>
          </div>
        ) : null}
      </div>

      {appointment ? (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3" data-print="hide">
            <Chip variant={appointment.status === "cancelled" ? "outline" : "filled"}>
              {s.labels[appointment.status] ?? appointment.status}
            </Chip>
            <p className="tnum text-14 text-muted">
              {formatDate(appointment.on_date)},{" "}
              {t.days.long[weekdayOf(appointment.on_date)]}
              {appointment.session_start
                ? ` · ${formatSessionClock(appointment.session_start, appointment.session_end)}`
                : ""}
            </p>
          </div>

          <div
            className={
              appointment.status === "cancelled"
                ? "mt-3 rounded-sm bg-white line-through"
                : "mt-3 rounded-sm bg-white"
            }
          >
            <AppointmentSlip slip={slip!} instructions={slipInstructions} />
          </div>

          {/* Online cancellation is off; a live booking points to the OPD counter. */}
          {appointment.status === "booked" || appointment.status === "arrived" ? (
            <div
              className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-4"
              data-print="hide"
            >
              <p className="text-15 text-ink">{s.callToChange}</p>
              <Link href="/contact" className="text-15 font-medium text-ink">
                {t.nav["/contact"] ?? "Contact and timings"}
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={s.cancelThis}
        description={s.modalDesc}
        footer={
          <>
            <Button onClick={() => setCancelOpen(false)}>{s.keep}</Button>
            <Button variant="primary" onClick={cancel}>
              {s.cancelBooking}
            </Button>
          </>
        }
      >
        {cancelError ? (
          <p role="alert" className="mb-4 border-l-2 border-navy pl-3 text-14">
            {cancelError}
          </p>
        ) : null}
        <Field
          id="cancelReason"
          label={s.reason}
          optional
          optionalLabel={t.common.optional}
        >
          {(control) => (
            <Textarea
              {...control}
              value={cancelReason}
              maxLength={200}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          )}
        </Field>
      </Modal>
    </div>
  );
}
