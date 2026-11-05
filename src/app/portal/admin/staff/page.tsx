import { StaffManager } from "./StaffManager";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireTech } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const staff = await requireTech();
  const supabase = await createServerSupabase();

  const [{ data: profiles }, { data: doctors }] = await Promise.all([
    supabase
      .from("staff_profiles")
      .select("id, full_name, role, doctor_id, phone, is_active, created_at")
      .order("role")
      .order("full_name"),
    supabase
      .from("doctors")
      .select("id, full_name")
      .order("display_order")
      .order("full_name"),
  ]);

  // Email addresses live in auth.users, which is only reachable with the
  // secret key. This page is already gated to tech by requireTech above.
  const admin = createAdminClient();
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 200 });
  const emailById = new Map(
    (authUsers?.users ?? []).map((user) => [user.id, user.email ?? ""]),
  );

  const rows = (profiles ?? []).map((row) => ({
    ...row,
    email: emailById.get(row.id) ?? "",
  }));

  const activeTechCount = rows.filter((r) => r.role === "tech" && r.is_active).length;

  return (
    <div className="page-width py-8">
      <h1 className="text-26 tracking-tighter">Staff accounts</h1>

      <div className="mt-6">
        <StaffManager
          rows={rows}
          doctors={doctors ?? []}
          currentUserId={staff.id}
          activeTechCount={activeTechCount}
        />
      </div>
    </div>
  );
}
