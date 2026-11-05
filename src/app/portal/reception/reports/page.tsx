import { ReportView, type ReportRow } from "./ReportView";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireDesk } from "@/lib/auth";
import { addDays, todayIST } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ from?: string; to?: string; doctor?: string }>;
};

export default async function ReportsPage({ searchParams }: Props) {
  await requireDesk();
  const params = await searchParams;

  const today = todayIST();
  const from = /^\d{4}-\d{2}-\d{2}$/.test(params.from ?? "")
    ? (params.from as string)
    : addDays(today, -29);
  const to = /^\d{4}-\d{2}-\d{2}$/.test(params.to ?? "")
    ? (params.to as string)
    : today;
  const doctorFilter = params.doctor ?? "";

  const supabase = await createServerSupabase();

  const { data: doctors } = await supabase
    .from("doctors")
    .select("id, full_name")
    .order("display_order")
    .order("full_name");

  let query = supabase
    .from("appointments")
    .select(
      "id, booking_ref, on_date, token_label, slot_time, patient_name, patient_age, patient_sex, patient_phone, patient_type, patient_id_no, status, source, booked_over_phone, is_overflow, created_at, doctor_id, doctors(full_name), staff_profiles(full_name)",
    )
    .gte("on_date", from)
    .lte("on_date", to)
    .order("on_date")
    .order("is_overflow")
    .order("token_no")
    .limit(5000);

  if (doctorFilter) query = query.eq("doctor_id", doctorFilter);

  const { data } = await query;

  const rows: ReportRow[] = (data ?? []).map((row) => ({
    id: row.id,
    bookingRef: row.booking_ref,
    onDate: row.on_date,
    tokenLabel: row.token_label ?? "",
    slotTime: row.slot_time,
    doctorName: row.doctors?.full_name ?? "",
    patientName: row.patient_name,
    patientAge: row.patient_age,
    patientSex: row.patient_sex,
    patientPhone: row.patient_phone,
    patientType: row.patient_type,
    patientIdNo: row.patient_id_no,
    status: row.status,
    source: row.source,
    bookedOverPhone: row.booked_over_phone,
    isOverflow: row.is_overflow,
    bookedBy: row.staff_profiles?.full_name ?? null,
    createdAt: row.created_at,
  }));

  return (
    <div className="page-width py-8">
      <h1 className="text-26 tracking-tighter">Appointments over a date range</h1>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="from" className="text-13 font-medium">
            From
          </label>
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            className="w-44"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="to" className="text-13 font-medium">
            To
          </label>
          <Input id="to" name="to" type="date" defaultValue={to} className="w-44" />
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
        <Button type="submit">Run report</Button>
      </form>

      <div className="mt-8">
        <ReportView rows={rows} from={from} to={to} />
      </div>
    </div>
  );
}
