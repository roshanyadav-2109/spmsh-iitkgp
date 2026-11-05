"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { downloadCsv, toCsv } from "@/lib/csv";
import {
  formatDate,
  formatSession,
  formatTime,
  todayIST,
  weekdayLabel,
} from "@/lib/dates";
import {
  addHoliday,
  approveException,
  cancelSession,
  countAffected,
  deactivateSchedule,
  deleteException,
  removeHoliday,
  saveException,
  saveSchedule,
  type ActionResult,
  type CallListEntry,
} from "./actions";

type Schedule = {
  id: string;
  doctor_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  max_patients: number;
  room_no: string | null;
};

type Exception = {
  id: string;
  doctor_id: string;
  on_date: string;
  kind: string;
  start_time: string | null;
  end_time: string | null;
  max_patients: number | null;
  reason: string | null;
  approved_at: string | null;
};

type Pending = {
  id: string;
  doctor_id: string;
  on_date: string;
  kind: string;
  reason: string | null;
  doctor_name: string;
};

type Holiday = { on_date: string; reason: string };

const KIND_LABEL: Record<string, string> = {
  holiday: "On leave",
  cancelled: "Session cancelled",
  modified: "Changed timing",
  extra: "Extra session",
};

export function AvailabilityManager({
  doctorId,
  doctorName,
  schedules,
  exceptions,
  pending,
  holidays,
}: {
  doctorId: string;
  doctorName: string;
  schedules: Schedule[];
  exceptions: Exception[];
  pending: Pending[];
  holidays: Holiday[];
}) {
  const [busy, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<Schedule | "new" | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{
    date: string;
    affected: number;
  } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [callList, setCallList] = useState<CallListEntry[] | null>(null);

  const run = (
    action: () => Promise<ActionResult>,
    onDone?: (r: ActionResult) => void,
  ) =>
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? null : (result.message ?? "That did not work."));
      if (result.ok) {
        setEditing(null);
        onDone?.(result);
      }
    });

  const openCancel = (date: string) =>
    startTransition(async () => {
      const affected = await countAffected(doctorId, date);
      setCancelReason("");
      setCallList(null);
      setCancelTarget({ date, affected });
    });

  const banner = message ? (
    <p role="alert" className="mb-4 rounded-sm border border-navy p-3 text-14">
      {message}
    </p>
  ) : null;

  // ------------------------------------------------------------- schedules
  const schedulesPanel = (
    <div>
      {banner}
      {schedules.length === 0 ? (
        <EmptyState
          title="No weekly sessions"
          description="This doctor has no active OPD session, so online booking is closed for them."
        />
      ) : (
        <table className="w-full text-14">
          <caption className="sr-only">Weekly OPD sessions for {doctorName}</caption>
          <thead>
            <tr>
              {["Day", "Timing", "Slot", "Tokens", "Room", ""].map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="border-b border-navy px-3 py-2 text-left text-13 font-medium"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedules.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2">{weekdayLabel(row.weekday)}</td>
                <td className="tnum px-3 py-2">
                  {formatSession(row.start_time, row.end_time)}
                </td>
                <td className="tnum px-3 py-2">{row.slot_minutes} min</td>
                <td className="tnum px-3 py-2">{row.max_patients}</td>
                <td className="px-3 py-2">{row.room_no ?? ""}</td>
                <td className="px-3 py-2">
                  <span className="flex gap-1">
                    <Button size="sm" variant="quiet" onClick={() => setEditing(row)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="quiet"
                      disabled={busy}
                      onClick={() => {
                        const data = new FormData();
                        data.set("id", row.id);
                        run(() => deactivateSchedule(data));
                      }}
                    >
                      Remove
                    </Button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-4">
        <Button
          variant="primary"
          onClick={() => setEditing("new")}
          disabled={!doctorId}
        >
          Add a weekly session
        </Button>
      </div>
    </div>
  );

  // ------------------------------------------------------------ exceptions
  const exceptionsPanel = (
    <div className="grid gap-8">
      {banner}

      {pending.length > 0 ? (
        <section aria-labelledby="pending">
          <h3 id="pending" className="text-18">
            Leave requests awaiting approval
          </h3>
          <p className="mt-1 text-14 text-muted">
            A request has no effect on booking until it is approved here. Approving does
            not cancel appointments; cancel the session separately if there are any.
          </p>
          <ul className="mt-4 grid gap-3">
            {pending.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <span className="text-14">
                  <span className="tnum">{formatDate(row.on_date)}</span> ·{" "}
                  {row.doctor_name} · {KIND_LABEL[row.kind] ?? row.kind}
                  {row.reason ? ` · ${row.reason}` : ""}
                </span>
                <span className="flex gap-1">
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      const data = new FormData();
                      data.set("id", row.id);
                      run(() => approveException(data));
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="quiet"
                    disabled={busy}
                    onClick={() => {
                      const data = new FormData();
                      data.set("id", row.id);
                      run(() => deleteException(data));
                    }}
                  >
                    Decline
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="upcoming">
        <h3 id="upcoming" className="text-18">
          Upcoming entries for {doctorName}
        </h3>
        {exceptions.length === 0 ? (
          <p className="mt-2 text-14 text-muted">Nothing recorded.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {exceptions.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <span className="text-14">
                  <span className="tnum">{formatDate(row.on_date)}</span> ·{" "}
                  {KIND_LABEL[row.kind] ?? row.kind}
                  {row.start_time
                    ? ` · ${formatTime(row.start_time)}-${formatTime(row.end_time)}`
                    : ""}
                  {row.reason ? ` · ${row.reason}` : ""}{" "}
                  {row.approved_at ? null : <Chip>Awaiting approval</Chip>}
                </span>
                <Button
                  size="sm"
                  variant="quiet"
                  disabled={busy}
                  onClick={() => {
                    const data = new FormData();
                    data.set("id", row.id);
                    run(() => deleteException(data));
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="add-exception">
        <h3 id="add-exception" className="text-18">
          Record a change
        </h3>
        <form
          action={(data) => {
            data.set("doctor_id", doctorId);
            run(() => saveException(data));
          }}
          className="mt-4 grid gap-4 sm:grid-cols-2"
        >
          <Field id="ex_on_date" label="Date">
            {(control) => (
              <Input
                {...control}
                name="on_date"
                type="date"
                min={todayIST()}
                required
              />
            )}
          </Field>
          <Field id="ex_kind" label="What is happening">
            {(control) => (
              <Select {...control} name="kind" defaultValue="holiday">
                <option value="holiday">Doctor on leave</option>
                <option value="cancelled">Session cancelled</option>
                <option value="modified">Changed timing</option>
                <option value="extra">Extra session</option>
              </Select>
            )}
          </Field>
          <Field
            id="ex_start"
            label="Start time"
            optional
            hint="Changed or extra sessions only."
          >
            {(control) => <Input {...control} name="start_time" type="time" />}
          </Field>
          <Field id="ex_end" label="End time" optional>
            {(control) => <Input {...control} name="end_time" type="time" />}
          </Field>
          <Field
            id="ex_max"
            label="Tokens"
            optional
            hint="Leave blank to keep the usual number."
          >
            {(control) => (
              <Input {...control} name="max_patients" inputMode="numeric" />
            )}
          </Field>
          <Field id="ex_reason" label="Reason">
            {(control) => <Input {...control} name="reason" required maxLength={200} />}
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" disabled={busy || !doctorId}>
              Save the change
            </Button>
          </div>
        </form>
      </section>

      <section aria-labelledby="cancel-session">
        <h3 id="cancel-session" className="text-18">
          Cancel a whole session
        </h3>
        <p className="mt-1 max-w-prose text-14 text-muted">
          This cancels every appointment on that date for {doctorName} and produces the
          list of people to telephone. It cannot be undone.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = new FormData(event.currentTarget).get("on_date");
            if (typeof value === "string" && value) openCancel(value);
          }}
          className="mt-4 flex flex-wrap items-end gap-4"
        >
          <Field id="cancel_date" label="Date">
            {(control) => (
              <Input
                {...control}
                name="on_date"
                type="date"
                min={todayIST()}
                required
              />
            )}
          </Field>
          <Button type="submit" disabled={busy || !doctorId}>
            Check and cancel
          </Button>
        </form>
      </section>
    </div>
  );

  // -------------------------------------------------------------- holidays
  const holidaysPanel = (
    <div>
      {banner}
      {holidays.length === 0 ? (
        <p className="text-14 text-muted">No upcoming closures.</p>
      ) : (
        <ul className="grid gap-3">
          {holidays.map((row) => (
            <li
              key={row.on_date}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <span className="text-14">
                <span className="tnum">{formatDate(row.on_date)}</span> · {row.reason}
              </span>
              <Button
                size="sm"
                variant="quiet"
                disabled={busy}
                onClick={() => {
                  const data = new FormData();
                  data.set("on_date", row.on_date);
                  run(() => removeHoliday(data));
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form
        action={(data) => run(() => addHoliday(data))}
        className="mt-6 flex flex-wrap items-end gap-4"
      >
        <Field id="hol_date" label="Date">
          {(control) => (
            <Input {...control} name="on_date" type="date" min={todayIST()} required />
          )}
        </Field>
        <Field id="hol_reason" label="Reason">
          {(control) => (
            <Input
              {...control}
              name="reason"
              required
              maxLength={200}
              className="w-72"
            />
          )}
        </Field>
        <Button type="submit" variant="primary" disabled={busy}>
          Add closure
        </Button>
      </form>

      <p className="mt-4 max-w-prose text-14 text-muted">
        A hospital closure overrides every schedule for that date. It does not cancel
        appointments already booked — cancel each affected session so the patients get a
        call.
      </p>
    </div>
  );

  return (
    <div>
      <Tabs
        label="Availability"
        tabs={[
          { id: "schedules", label: "Weekly sessions", panel: schedulesPanel },
          {
            id: "exceptions",
            label: `Changes and leave${pending.length ? ` (${pending.length})` : ""}`,
            panel: exceptionsPanel,
          },
          { id: "holidays", label: "Hospital closures", panel: holidaysPanel },
        ]}
      />

      {/* Weekly session editor ------------------------------------------- */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add a weekly session" : "Edit the weekly session"}
        description={`${doctorName}. One active session per weekday.`}
      >
        <form
          action={(data) => {
            data.set("doctor_id", doctorId);
            if (editing && editing !== "new") data.set("id", editing.id);
            run(() => saveSchedule(data));
          }}
          className="grid gap-4"
        >
          <Field id="sch_weekday" label="Day">
            {(control) => (
              <Select
                {...control}
                name="weekday"
                defaultValue={
                  editing && editing !== "new" ? String(editing.weekday) : "1"
                }
              >
                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                  <option key={day} value={day}>
                    {weekdayLabel(day)}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field id="sch_start" label="Start">
              {(control) => (
                <Input
                  {...control}
                  name="start_time"
                  type="time"
                  required
                  defaultValue={
                    editing && editing !== "new"
                      ? formatTime(editing.start_time)
                      : "09:00"
                  }
                />
              )}
            </Field>
            <Field id="sch_end" label="End">
              {(control) => (
                <Input
                  {...control}
                  name="end_time"
                  type="time"
                  required
                  defaultValue={
                    editing && editing !== "new"
                      ? formatTime(editing.end_time)
                      : "13:00"
                  }
                />
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field id="sch_slot" label="Minutes per patient">
              {(control) => (
                <Input
                  {...control}
                  name="slot_minutes"
                  inputMode="numeric"
                  required
                  defaultValue={
                    editing && editing !== "new" ? editing.slot_minutes : 10
                  }
                />
              )}
            </Field>
            <Field id="sch_max" label="Tokens for the session">
              {(control) => (
                <Input
                  {...control}
                  name="max_patients"
                  inputMode="numeric"
                  required
                  defaultValue={
                    editing && editing !== "new" ? editing.max_patients : 24
                  }
                />
              )}
            </Field>
          </div>

          <Field id="sch_room" label="Room" optional>
            {(control) => (
              <Input
                {...control}
                name="room_no"
                defaultValue={
                  editing && editing !== "new" ? (editing.room_no ?? "") : ""
                }
              />
            )}
          </Field>

          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setEditing(null)}>
              Discard
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              Save session
            </Button>
          </div>
        </form>
      </Modal>

      {/* Session cancellation -------------------------------------------- */}
      <Modal
        open={cancelTarget !== null}
        onClose={() => {
          setCancelTarget(null);
          setCallList(null);
        }}
        title="Cancel this session"
        description={
          cancelTarget
            ? `${doctorName}, ${formatDate(cancelTarget.date)}. ${
                cancelTarget.affected === 0
                  ? "No appointments are booked."
                  : cancelTarget.affected === 1
                    ? "1 appointment will be cancelled."
                    : `${cancelTarget.affected} appointments will be cancelled.`
              }`
            : undefined
        }
        footer={
          callList ? (
            <>
              <Button
                onClick={() =>
                  downloadCsv(
                    `call-list-${cancelTarget?.date}.csv`,
                    toCsv(
                      ["Token", "Reference", "Time", "Patient", "Phone", "Type"],
                      callList.map((row) => [
                        row.token_label,
                        row.booking_ref,
                        formatTime(row.slot_time),
                        row.patient_name,
                        row.patient_phone,
                        row.patient_type,
                      ]),
                    ),
                  )
                }
              >
                Download the call list
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setCancelTarget(null);
                  setCallList(null);
                }}
              >
                Done
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setCancelTarget(null)}>Keep the session</Button>
              <Button
                variant="primary"
                disabled={busy || cancelReason.trim().length < 3}
                onClick={() => {
                  if (!cancelTarget) return;
                  const data = new FormData();
                  data.set("doctor_id", doctorId);
                  data.set("on_date", cancelTarget.date);
                  data.set("reason", cancelReason);
                  run(
                    () => cancelSession(data),
                    (result) => setCallList(result.callList ?? []),
                  );
                }}
              >
                Cancel the session
              </Button>
            </>
          )
        }
      >
        {callList ? (
          <div>
            <p className="text-15">
              {callList.length === 0
                ? "The session is cancelled. Nobody needs to be telephoned."
                : `The session is cancelled. Telephone these ${callList.length} patients.`}
            </p>
            {callList.length > 0 ? (
              <ul className="mt-4 grid gap-3">
                {callList.map((row) => (
                  <li key={row.booking_ref} className="text-14">
                    <span className="tnum">{row.token_label}</span> · {row.patient_name}{" "}
                    · <span className="tnum">{row.patient_phone}</span> ·{" "}
                    {row.patient_type}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <Field
            id="session_cancel_reason"
            label="Reason"
            hint="Shown to patients on the doctor page and recorded in the audit log."
          >
            {(control) => (
              <Input
                {...control}
                value={cancelReason}
                maxLength={200}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            )}
          </Field>
        )}
      </Modal>
    </div>
  );
}
