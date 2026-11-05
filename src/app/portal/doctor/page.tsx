import Link from "next/link";
import { DoctorDayList, type DoctorRow } from "./DoctorDayList";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { addDays, formatDate, todayIST, weekdayName } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ date?: string }> };

export default async function DoctorTodayPage({ searchParams }: Props) {
  const staff = await requireRole(["doctor"]);
  const params = await searchParams;

  const today = todayIST();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "")
    ? (params.date as string)
    : today;
  const isPast = date < today;

  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("appointments")
    .select(
      "id, token_label, is_overflow, slot_time, patient_name, patient_age, patient_sex, patient_type, reason, status, doctor_remarks",
    )
    .eq("doctor_id", staff.doctorId ?? "")
    .eq("on_date", date)
    .order("is_overflow")
    .order("token_no");

  const rows: DoctorRow[] = (data ?? []).map((row) => ({
    id: row.id,
    tokenLabel: row.token_label ?? "",
    isOverflow: row.is_overflow,
    slotTime: row.slot_time,
    patientName: row.patient_name,
    patientAge: row.patient_age,
    patientSex: row.patient_sex,
    patientType: row.patient_type,
    reason: row.reason,
    status: row.status,
    remarks: row.doctor_remarks,
  }));

  const live = rows.filter((row) => row.status !== "cancelled");
  const counts = {
    total: live.length,
    attended: live.filter((r) => r.status === "attended").length,
    waiting: live.filter((r) => r.status === "booked" || r.status === "arrived").length,
    noShow: live.filter((r) => r.status === "no_show").length,
  };

  return (
    <div className="page-width py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-26 tracking-tighter">
            {formatDate(date)}, {weekdayName(date)}
          </h1>
        </div>
        <nav
          aria-label="Change day"
          className="inline-flex overflow-hidden rounded-md border border-line-strong bg-white text-14"
        >
          <Link
            href={`/portal/doctor?date=${addDays(date, -1)}`}
            className="px-4 py-2 text-ink no-underline hover:bg-tint-neutral"
          >
            Previous day
          </Link>
          <Link
            href="/portal/doctor"
            className="border-x border-line-strong px-4 py-2 font-medium text-ink no-underline hover:bg-tint-neutral"
          >
            Today
          </Link>
          <Link
            href={`/portal/doctor?date=${addDays(date, 1)}`}
            className="px-4 py-2 text-ink no-underline hover:bg-tint-neutral"
          >
            Next day
          </Link>
        </nav>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Patients booked", value: counts.total },
          { label: "Waiting", value: counts.waiting },
          { label: "Attended", value: counts.attended },
          { label: "Did not come", value: counts.noShow },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-line bg-white px-5 py-4"
          >
            <dt className="text-13 text-muted">{item.label}</dt>
            <dd className="tnum mt-1 text-32 font-medium leading-none tracking-tight text-ink">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      {isPast ? (
        <p className="mt-4 rounded-lg border border-line bg-white px-4 py-3 text-14">
          This day has passed. The list is read-only.
        </p>
      ) : null}

      <div className="mt-8">
        <DoctorDayList rows={rows} readOnly={isPast} />
      </div>
    </div>
  );
}
