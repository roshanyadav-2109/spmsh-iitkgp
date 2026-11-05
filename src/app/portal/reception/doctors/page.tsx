import { DoctorManager } from "./DoctorManager";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireDesk } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DoctorsAdminPage() {
  await requireDesk();
  const supabase = await createServerSupabase();

  const [{ data: doctors }, { data: departments }, { data: schedules }] =
    await Promise.all([
      supabase
        .from("doctors")
        .select(
          "id, full_name, slug, designation, qualifications, registration_no, room_no, about, photo_path, display_order, is_active, department_id",
        )
        .order("display_order")
        .order("full_name"),
      supabase
        .from("departments")
        .select("id, name")
        .order("display_order")
        .order("name"),
      supabase.from("doctor_schedules").select("doctor_id").eq("is_active", true),
    ]);

  const sessionCount = new Map<string, number>();
  for (const row of schedules ?? []) {
    sessionCount.set(row.doctor_id, (sessionCount.get(row.doctor_id) ?? 0) + 1);
  }

  return (
    <div className="page-width py-8">
      <h1 className="text-26 tracking-tighter">Doctors</h1>
      <p className="mt-3 max-w-prose text-15 text-muted">
        A doctor with historical appointments is never deleted. Deactivating hides them
        from the public site and closes booking, and keeps the record of who saw whom.
      </p>

      <div className="mt-8">
        <DoctorManager
          doctors={(doctors ?? []).map((row) => ({
            ...row,
            sessions: sessionCount.get(row.id) ?? 0,
          }))}
          departments={departments ?? []}
        />
      </div>
    </div>
  );
}
