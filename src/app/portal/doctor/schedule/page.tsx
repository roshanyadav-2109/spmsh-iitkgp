import { LeaveRequest } from "./LeaveRequest";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, type Column } from "@/components/ui/Table";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import {
  formatDate,
  formatSession,
  formatTime,
  todayIST,
  weekdayLabel,
} from "@/lib/dates";

export const dynamic = "force-dynamic";

type ScheduleRow = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  max_patients: number;
  room_no: string | null;
};

const KIND_LABEL: Record<string, string> = {
  holiday: "On leave",
  cancelled: "Session cancelled",
  modified: "Changed timing",
  extra: "Extra session",
};

export default async function DoctorSchedulePage() {
  const staff = await requireRole(["doctor"]);
  const supabase = await createServerSupabase();
  const today = todayIST();

  const [{ data: schedules }, { data: exceptions }] = await Promise.all([
    supabase
      .from("doctor_schedules")
      .select("id, weekday, start_time, end_time, slot_minutes, max_patients, room_no")
      .eq("doctor_id", staff.doctorId ?? "")
      .eq("is_active", true)
      .order("weekday"),
    supabase
      .from("schedule_exceptions")
      .select("id, on_date, kind, start_time, end_time, reason, approved_at")
      .eq("doctor_id", staff.doctorId ?? "")
      .gte("on_date", today)
      .order("on_date"),
  ]);

  const columns: Column<ScheduleRow>[] = [
    {
      key: "day",
      header: "Day",
      stackedTitle: true,
      cell: (r) => weekdayLabel(r.weekday),
    },
    {
      key: "timing",
      header: "Timing",
      cell: (r) => (
        <span className="tnum">{formatSession(r.start_time, r.end_time)}</span>
      ),
    },
    {
      key: "slot",
      header: "Minutes per patient",
      cell: (r) => <span className="tnum">{r.slot_minutes}</span>,
    },
    {
      key: "tokens",
      header: "Tokens",
      align: "right",
      cell: (r) => <span className="tnum">{r.max_patients}</span>,
    },
    { key: "room", header: "Room", cell: (r) => r.room_no ?? "" },
  ];

  return (
    <div className="page-width py-8">
      <h1 className="text-26 tracking-tighter">My schedule</h1>
      <p className="mt-3 max-w-prose text-15 text-muted">
        This is read-only. Reception maintains the timetable. To take a day off, send a
        leave request below — reception approves it and telephones any patients who are
        already booked.
      </p>

      <section aria-labelledby="weekly" className="mt-8">
        <h2 id="weekly" className="text-21 tracking-tight">
          Weekly OPD
        </h2>
        <div className="mt-4">
          <Table
            caption="My weekly OPD sessions"
            columns={columns}
            rows={(schedules ?? []) as ScheduleRow[]}
            rowKey={(row) => row.id}
            empty={
              <EmptyState
                title="No weekly sessions"
                description="Reception has not set an OPD timetable for this account yet."
              />
            }
          />
        </div>
      </section>

      <section aria-labelledby="upcoming" className="mt-12">
        <h2 id="upcoming" className="text-21 tracking-tight">
          Upcoming changes
        </h2>
        {(exceptions ?? []).length === 0 ? (
          <p className="mt-4 text-15 text-muted">Nothing recorded.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {(exceptions ?? []).map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-3">
                <span className="tnum text-15">{formatDate(row.on_date)}</span>
                <span className="text-15">{KIND_LABEL[row.kind] ?? row.kind}</span>
                {row.start_time ? (
                  <span className="tnum text-14 text-muted">
                    {formatTime(row.start_time)}-{formatTime(row.end_time)}
                  </span>
                ) : null}
                {row.reason ? (
                  <span className="text-14 text-muted">{row.reason}</span>
                ) : null}
                <Chip variant={row.approved_at ? "filled" : "outline"}>
                  {row.approved_at ? "Approved" : "Awaiting reception"}
                </Chip>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="request" className="mt-12 max-w-lg">
        <h2 id="request" className="text-21 tracking-tight">
          Request leave
        </h2>
        <LeaveRequest />
      </section>
    </div>
  );
}
