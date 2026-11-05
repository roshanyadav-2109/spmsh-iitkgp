import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getStaff } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Phone-first patient lookup for the counter.
 *
 * Returns the single most recent record for a number, and the count of live
 * appointments that number already holds for the given date. Nothing is
 * autofilled from this: the operator sees a one-line suggestion and chooses.
 *
 * Staff only, and reception or tech only. A doctor has no business pulling up
 * a patient record by phone number.
 */
export async function GET(request: Request) {
  const staff = await getStaff();
  if (!staff || (staff.role !== "reception" && staff.role !== "tech")) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const url = new URL(request.url);
  const phone = (url.searchParams.get("phone") ?? "").trim();
  const onDate = url.searchParams.get("date") ?? "";

  if (!/^[6-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ ok: true, patient: null, sameDayCount: 0 });
  }

  const supabase = await createServerSupabase();

  const { data: recent } = await supabase
    .from("appointments")
    .select(
      "patient_name, patient_age, patient_sex, patient_type, patient_id_no, created_at",
    )
    .eq("patient_phone", phone)
    .order("created_at", { ascending: false })
    .limit(1);

  let sameDayCount = 0;
  if (/^\d{4}-\d{2}-\d{2}$/.test(onDate)) {
    const { count } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("patient_phone", phone)
      .eq("on_date", onDate)
      .neq("status", "cancelled");
    sameDayCount = count ?? 0;
  }

  return NextResponse.json({
    ok: true,
    patient: recent?.[0] ?? null,
    sameDayCount,
  });
}
