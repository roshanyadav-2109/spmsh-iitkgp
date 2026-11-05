import Link from "next/link";
import { AvailabilityManager } from "./AvailabilityManager";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireDesk } from "@/lib/auth";
import { todayIST } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ doctor?: string }> };

export default async function AvailabilityPage({ searchParams }: Props) {
  await requireDesk();
  const { doctor: doctorId } = await searchParams;
  const supabase = await createServerSupabase();
  const today = todayIST();

  const { data: doctors } = await supabase
    .from("doctors")
    .select("id, full_name, room_no, is_active")
    .order("display_order")
    .order("full_name");

  const selectedId = doctorId ?? doctors?.[0]?.id ?? "";

  const [
    { data: schedules },
    { data: exceptions },
    { data: pending },
    { data: holidays },
  ] = await Promise.all([
    selectedId
      ? supabase
          .from("doctor_schedules")
          .select(
            "id, doctor_id, weekday, start_time, end_time, slot_minutes, max_patients, room_no",
          )
          .eq("doctor_id", selectedId)
          .eq("is_active", true)
          .order("weekday")
      : Promise.resolve({ data: [] }),
    selectedId
      ? supabase
          .from("schedule_exceptions")
          .select(
            "id, doctor_id, on_date, kind, start_time, end_time, max_patients, reason, approved_at",
          )
          .eq("doctor_id", selectedId)
          .gte("on_date", today)
          .order("on_date")
      : Promise.resolve({ data: [] }),
    supabase
      .from("schedule_exceptions")
      .select("id, doctor_id, on_date, kind, reason, doctors(full_name)")
      .is("approved_at", null)
      .gte("on_date", today)
      .order("on_date"),
    supabase
      .from("hospital_holidays")
      .select("on_date, reason")
      .gte("on_date", today)
      .order("on_date"),
  ]);

  return (
    <div className="page-width py-8">
      <h1 className="text-26 tracking-tighter">Doctor schedules and closures</h1>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="doctor" className="text-13 font-medium">
            Doctor
          </label>
          <Select id="doctor" name="doctor" defaultValue={selectedId} className="w-72">
            {(doctors ?? []).map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.full_name}
                {doctor.is_active ? "" : " (inactive)"}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit">Show</Button>
        <Link href="/portal/reception/doctors" className="pb-2 text-14">
          Manage doctor records
        </Link>
      </form>

      <div className="mt-8">
        <AvailabilityManager
          doctorId={selectedId}
          doctorName={(doctors ?? []).find((d) => d.id === selectedId)?.full_name ?? ""}
          schedules={schedules ?? []}
          exceptions={exceptions ?? []}
          pending={(pending ?? []).map((row) => ({
            id: row.id,
            doctor_id: row.doctor_id,
            on_date: row.on_date,
            kind: row.kind,
            reason: row.reason,
            doctor_name: row.doctors?.full_name ?? "",
          }))}
          holidays={holidays ?? []}
        />
      </div>
    </div>
  );
}
