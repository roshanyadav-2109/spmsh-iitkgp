import { CounterBooking, type CounterDoctor } from "./CounterBooking";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireDesk } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { todayIST } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function CounterBookingPage() {
  const staff = await requireDesk();
  const supabase = await createServerSupabase();
  const today = todayIST();

  const [{ data: departments }, { data: doctorRows }, { data: schedules }, settings] =
    await Promise.all([
      supabase
        .from("departments")
        .select("id, name")
        .order("display_order")
        .order("name"),
      supabase
        .from("doctors")
        .select("id, full_name, designation, room_no, department_id")
        .order("display_order")
        .order("full_name"),
      supabase.from("doctor_schedules").select("doctor_id").eq("is_active", true),
      getSettings(),
    ]);

  const bookable = new Set((schedules ?? []).map((row) => row.doctor_id));

  const doctors: CounterDoctor[] = (doctorRows ?? [])
    .filter((row) => bookable.has(row.id))
    .map((row) => ({
      id: row.id,
      fullName: row.full_name,
      designation: row.designation,
      roomNo: row.room_no,
      departmentId: row.department_id,
      departmentName:
        (departments ?? []).find((d) => d.id === row.department_id)?.name ?? "Other",
    }));

  // "Booked at this desk today". Counts this operator's own bookings.
  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("created_by", staff.id)
    .gte("created_at", `${today}T00:00:00+05:30`);

  return (
    <CounterBooking
      doctors={doctors}
      windowDays={Number.parseInt(settings.booking_window_days ?? "7", 10) || 7}
      overflowEnabled={
        (settings.overflow_booking_enabled ?? "false").toLowerCase() === "true"
      }
      perPhoneDailyLimit={
        Number.parseInt(settings.per_phone_daily_limit ?? "2", 10) || 2
      }
      bookedTodayInitial={count ?? 0}
      operatorName={staff.fullName}
      slipInstructions={settings.slip_instructions}
    />
  );
}
