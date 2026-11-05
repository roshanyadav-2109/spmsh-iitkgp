import Link from "next/link";
import { AppointmentBoard, type BoardRow } from "./AppointmentBoard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireDesk } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { addDays, formatDate, todayIST, weekdayName } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    date?: string;
    doctor?: string;
    status?: string;
    q?: string;
  }>;
};

export default async function ReceptionBoardPage({ searchParams }: Props) {
  await requireDesk();
  const params = await searchParams;

  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "")
    ? (params.date as string)
    : todayIST();
  const doctorFilter = params.doctor ?? "";
  const statusFilter = params.status ?? "";
  const search = (params.q ?? "").trim();

  const supabase = await createServerSupabase();
  const settings = await getSettings();

  const { data: doctors } = await supabase
    .from("doctors")
    .select("id, full_name")
    .order("display_order")
    .order("full_name");

  let query = supabase
    .from("appointments")
    .select(
      "id, booking_ref, token_no, token_label, is_overflow, slot_time, on_date, patient_name, patient_age, patient_sex, patient_phone, patient_type, patient_id_no, reason, status, source, booked_over_phone, doctor_id, doctors(full_name, room_no)",
    )
    .eq("on_date", date)
    .order("is_overflow")
    .order("token_no");

  if (doctorFilter) query = query.eq("doctor_id", doctorFilter);
  if (statusFilter) {
    query = query.eq(
      "status",
      statusFilter as "booked" | "arrived" | "attended" | "no_show" | "cancelled",
    );
  }
  if (search) {
    const escaped = search.replace(/[,()]/g, " ");
    query = query.or(
      `patient_name.ilike.%${escaped}%,patient_phone.ilike.%${escaped}%,booking_ref.ilike.%${escaped}%`,
    );
  }

  const { data } = await query;

  const rows: BoardRow[] = (data ?? []).map((row) => ({
    id: row.id,
    bookingRef: row.booking_ref,
    tokenLabel: row.token_label ?? String(row.token_no),
    isOverflow: row.is_overflow,
    slotTime: row.slot_time,
    onDate: row.on_date,
    patientName: row.patient_name,
    patientAge: row.patient_age,
    patientSex: row.patient_sex,
    patientPhone: row.patient_phone,
    patientType: row.patient_type,
    patientIdNo: row.patient_id_no,
    reason: row.reason,
    status: row.status,
    source: row.source,
    bookedOverPhone: row.booked_over_phone,
    doctorName: row.doctors?.full_name ?? "",
    roomNo: row.doctors?.room_no ?? null,
  }));

  const counts = {
    total: rows.filter((r) => r.status !== "cancelled").length,
    arrived: rows.filter((r) => r.status === "arrived").length,
    attended: rows.filter((r) => r.status === "attended").length,
    noShow: rows.filter((r) => r.status === "no_show").length,
    cancelled: rows.filter((r) => r.status === "cancelled").length,
  };

  const qs = new URLSearchParams();
  if (doctorFilter) qs.set("doctor", doctorFilter);
  if (statusFilter) qs.set("status", statusFilter);
  if (search) qs.set("q", search);
  const withDate = (d: string) => {
    const next = new URLSearchParams(qs);
    next.set("date", d);
    return `/portal/reception?${next.toString()}`;
  };

  return (
    <div className="page-width py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-26 tracking-tighter">
            {formatDate(date)}, {weekdayName(date)}
          </h1>
        </div>
        <div
          className="inline-flex overflow-hidden rounded-md border border-line-strong bg-white text-14"
          data-print="hide"
        >
          <Link
            href={withDate(addDays(date, -1))}
            className="px-4 py-2 text-ink no-underline hover:bg-tint-neutral"
          >
            Previous day
          </Link>
          <Link
            href={withDate(todayIST())}
            className="border-x border-line-strong px-4 py-2 font-medium text-ink no-underline hover:bg-tint-neutral"
          >
            Today
          </Link>
          <Link
            href={withDate(addDays(date, 1))}
            className="px-4 py-2 text-ink no-underline hover:bg-tint-neutral"
          >
            Next day
          </Link>
        </div>
      </div>

      {/* The day in five figures. */}
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Booked today", value: counts.total },
          { label: "Arrived", value: counts.arrived },
          { label: "Attended", value: counts.attended },
          { label: "Did not come", value: counts.noShow },
          { label: "Cancelled", value: counts.cancelled },
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

      <form
        method="get"
        action="/portal/reception"
        className="mt-6 flex flex-wrap items-end gap-4 rounded-lg border border-line bg-white p-5"
        data-print="hide"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="date" className="text-13 font-medium">
            Date
          </label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={date}
            className="w-44"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="doctor" className="text-13 font-medium">
            Doctor
          </label>
          <Select
            id="doctor"
            name="doctor"
            defaultValue={doctorFilter}
            className="w-56"
          >
            <option value="">All doctors</option>
            {(doctors ?? []).map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.full_name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="status" className="text-13 font-medium">
            Status
          </label>
          <Select
            id="status"
            name="status"
            defaultValue={statusFilter}
            className="w-44"
          >
            <option value="">All statuses</option>
            <option value="booked">Booked</option>
            <option value="arrived">Arrived</option>
            <option value="attended">Attended</option>
            <option value="no_show">Did not come</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="q" className="text-13 font-medium">
            Name, phone or reference
          </label>
          <Input id="q" name="q" type="search" defaultValue={search} className="w-56" />
        </div>
        <Button type="submit">Apply</Button>
        <Link href="/portal/reception" className="pb-2 text-14">
          Clear
        </Link>
        <Link
          href={`/portal/reception/print?date=${date}${doctorFilter ? `&doctor=${doctorFilter}` : ""}`}
          className="pb-2 text-14"
        >
          Print this day
        </Link>
      </form>

      <div className="mt-8">
        <AppointmentBoard rows={rows} slipInstructions={settings.slip_instructions} />
      </div>
    </div>
  );
}
