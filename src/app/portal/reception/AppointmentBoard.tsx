"use client";

import { useState, useTransition } from "react";
import { AppointmentSlip, type Slip } from "@/components/AppointmentSlip";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { Textarea } from "@/components/ui/Textarea";
import { PATIENT_SEXES, PATIENT_TYPES } from "@/lib/booking/schema";
import { formatTime } from "@/lib/dates";
import {
  cancelAppointment,
  setAppointmentStatus,
  updatePatientDetails,
} from "./actions";

export type BoardRow = {
  id: string;
  bookingRef: string;
  tokenLabel: string;
  isOverflow: boolean;
  slotTime: string | null;
  onDate: string;
  patientName: string;
  patientAge: number;
  patientSex: string;
  patientPhone: string;
  patientType: string;
  patientIdNo: string | null;
  reason: string | null;
  status: string;
  source: string;
  bookedOverPhone: boolean;
  doctorName: string;
  roomNo: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  booked: "Booked",
  arrived: "Arrived",
  attended: "Attended",
  no_show: "Did not come",
  cancelled: "Cancelled",
};

export function AppointmentBoard({
  rows,
  slipInstructions,
}: {
  rows: BoardRow[];
  /** site_settings.slip_instructions, printed on the slip. */
  slipInstructions?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<BoardRow | null>(null);
  const [editing, setEditing] = useState<BoardRow | null>(null);
  const [printing, setPrinting] = useState<BoardRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const run = (action: () => Promise<{ ok: boolean; message?: string }>) => {
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? null : (result.message ?? "That did not work."));
      if (result.ok) {
        setCancelling(null);
        setEditing(null);
        setModalError(null);
        setCancelReason("");
      } else {
        setModalError(result.message ?? "That did not work.");
      }
    });
  };

  const statusAction = (row: BoardRow, status: string) => {
    const data = new FormData();
    data.set("id", row.id);
    data.set("status", status);
    run(() => setAppointmentStatus(data));
  };

  const columns: Column<BoardRow>[] = [
    {
      key: "token",
      header: "Token",
      stackedTitle: true,
      cell: (row) => (
        <span className="tnum">
          {row.tokenLabel}
          {row.isOverflow ? <span className="text-muted"> extra token</span> : null}
        </span>
      ),
    },
    {
      key: "time",
      header: "Time",
      cell: (row) => <span className="tnum">{formatTime(row.slotTime)}</span>,
    },
    {
      key: "patient",
      header: "Patient",
      cell: (row) => (
        <span>
          <span className="block">{row.patientName}</span>
          {row.reason ? (
            <span className="block text-13 text-muted">{row.reason}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: "agesex",
      header: "Age / Sex",
      cell: (row) => (
        <span className="tnum whitespace-nowrap">
          {row.patientAge} / {row.patientSex.charAt(0)}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => <span className="tnum">{row.patientPhone}</span>,
    },
    {
      key: "type",
      header: "Type",
      cell: (row) => (
        <span>
          {row.patientType}
          {row.patientIdNo ? (
            <span className="block text-13 text-muted tnum">{row.patientIdNo}</span>
          ) : null}
        </span>
      ),
    },
    { key: "doctor", header: "Doctor", cell: (row) => row.doctorName },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span className="grid gap-1">
          <Chip variant={row.status === "attended" ? "filled" : "outline"}>
            {STATUS_LABEL[row.status] ?? row.status}
          </Chip>
          <span className="text-13 text-muted">
            {row.source === "reception"
              ? row.bookedOverPhone
                ? "Desk, by phone"
                : "Desk"
              : "Online"}
          </span>
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      hideWhenStacked: false,
      cell: (row) => (
        <span className="flex flex-wrap gap-1" data-print="hide">
          {/* Every status a live appointment can hold stays reachable, even
              after one has been set. A desk mis-taps under pressure, and a
              one-way "Attended" with no route back is worse than a second
              tap. The chip in the Status column shows which one is current.
              "Did not come" had no control here at all, although the filter,
              the day counts and the reports all expect it. */}
          {row.status !== "cancelled" && row.status !== "arrived" ? (
            <Button
              size="sm"
              variant="quiet"
              disabled={pending}
              onClick={() => statusAction(row, "arrived")}
            >
              Arrived
            </Button>
          ) : null}
          {row.status !== "cancelled" && row.status !== "attended" ? (
            <Button
              size="sm"
              variant="quiet"
              disabled={pending}
              onClick={() => statusAction(row, "attended")}
            >
              Attended
            </Button>
          ) : null}
          {row.status !== "cancelled" && row.status !== "no_show" ? (
            <Button
              size="sm"
              variant="quiet"
              disabled={pending}
              onClick={() => statusAction(row, "no_show")}
            >
              Did not come
            </Button>
          ) : null}
          {row.status !== "cancelled" ? (
            <Button
              size="sm"
              variant="quiet"
              disabled={pending}
              onClick={() => {
                setModalError(null);
                setCancelReason("");
                setCancelling(row);
              }}
            >
              Cancel
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="quiet"
            onClick={() => {
              setModalError(null);
              setEditing(row);
            }}
          >
            Edit
          </Button>
          <Button size="sm" variant="quiet" onClick={() => setPrinting(row)}>
            Slip
          </Button>
        </span>
      ),
    },
  ];

  const slipFor = (row: BoardRow): Slip => ({
    bookingRef: row.bookingRef,
    tokenLabel: row.tokenLabel,
    slotTime: row.slotTime,
    onDate: row.onDate,
    isOverflow: row.isOverflow,
    doctorName: row.doctorName,
    departmentName: null,
    roomNo: row.roomNo,
    sessionStart: null,
    sessionEnd: null,
    patientName: row.patientName,
    patientAge: row.patientAge,
    patientSex: row.patientSex,
    patientType: row.patientType,
  });

  return (
    <div>
      {message ? (
        <p role="alert" className="mb-4 rounded-sm border border-navy p-3 text-14">
          {message}
        </p>
      ) : null}

      <Table
        caption="Appointments for the selected day"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        rowClassName={(row) =>
          row.status === "cancelled" ? "line-through" : undefined
        }
        empty={
          <EmptyState
            title="No appointments for this day"
            description="Change the date or clear the filters. Bookings made at the counter appear here immediately."
          />
        }
      />

      {/* Cancel ------------------------------------------------------------ */}
      <Modal
        open={cancelling !== null}
        onClose={() => setCancelling(null)}
        title="Cancel this appointment"
        description={
          cancelling
            ? `Token ${cancelling.tokenLabel}, ${cancelling.patientName}. The token number is not reissued.`
            : undefined
        }
        footer={
          <>
            <Button onClick={() => setCancelling(null)}>Keep the appointment</Button>
            <Button
              variant="primary"
              disabled={pending}
              onClick={() => {
                if (!cancelling) return;
                const data = new FormData();
                data.set("id", cancelling.id);
                data.set("reason", cancelReason);
                run(() => cancelAppointment(data));
              }}
            >
              Cancel appointment
            </Button>
          </>
        }
      >
        {modalError ? (
          <p role="alert" className="mb-4 border-l-2 border-navy pl-3 text-14">
            {modalError}
          </p>
        ) : null}
        <Field id="cancelReason" label="Reason" hint="Recorded in the audit log.">
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

      {/* Edit -------------------------------------------------------------- */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit patient details"
        description={
          editing ? `Token ${editing.tokenLabel}, ${editing.bookingRef}` : undefined
        }
      >
        {editing ? (
          <form
            action={(data) => run(() => updatePatientDetails(data))}
            className="grid gap-4"
          >
            {modalError ? (
              <p role="alert" className="border-l-2 border-navy pl-3 text-14">
                {modalError}
              </p>
            ) : null}
            <input type="hidden" name="id" value={editing.id} />

            <Field id="patient_name" label="Patient name">
              {(control) => (
                <Input
                  {...control}
                  name="patient_name"
                  defaultValue={editing.patientName}
                />
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field id="patient_age" label="Age">
                {(control) => (
                  <Input
                    {...control}
                    name="patient_age"
                    inputMode="numeric"
                    defaultValue={editing.patientAge}
                  />
                )}
              </Field>
              <Field id="patient_sex" label="Sex">
                {(control) => (
                  <Select
                    {...control}
                    name="patient_sex"
                    defaultValue={editing.patientSex}
                  >
                    {PATIENT_SEXES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>

            <Field id="patient_phone" label="Mobile number">
              {(control) => (
                <Input
                  {...control}
                  name="patient_phone"
                  inputMode="numeric"
                  defaultValue={editing.patientPhone}
                />
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field id="patient_type" label="Patient type">
                {(control) => (
                  <Select
                    {...control}
                    name="patient_type"
                    defaultValue={editing.patientType}
                  >
                    {PATIENT_TYPES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field id="patient_id_no" label="Roll / employee no" optional>
                {(control) => (
                  <Input
                    {...control}
                    name="patient_id_no"
                    defaultValue={editing.patientIdNo ?? ""}
                  />
                )}
              </Field>
            </div>

            <Field id="reason" label="Reason for the visit" optional>
              {(control) => (
                <Textarea
                  {...control}
                  name="reason"
                  maxLength={200}
                  defaultValue={editing.reason ?? ""}
                />
              )}
            </Field>

            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setEditing(null)}>
                Discard
              </Button>
              <Button type="submit" variant="primary" disabled={pending}>
                Save details
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      {/* Slip -------------------------------------------------------------- */}
      <Modal
        open={printing !== null}
        onClose={() => setPrinting(null)}
        title="Appointment slip"
        className="max-w-2xl"
      >
        {printing ? (
          <AppointmentSlip slip={slipFor(printing)} instructions={slipInstructions} />
        ) : null}
      </Modal>
    </div>
  );
}
