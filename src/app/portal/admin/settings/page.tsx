import { SettingsManager } from "@/components/portal/SettingsManager";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireTech } from "@/lib/auth";
import { saveAnySetting } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireTech();
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("site_settings")
    .select("key, value, label, is_booking_policy, updated_at")
    .order("is_booking_policy", { ascending: false })
    .order("key");

  return (
    <div className="page-width py-8">
      <h1 className="text-26 tracking-tighter">Site settings</h1>
      <p className="mt-3 text-15 text-muted">
        Booking policy can also be changed by reception. Everything else is changed here
        only.
      </p>

      <div className="mt-8">
        <SettingsManager rows={data ?? []} save={saveAnySetting} />
      </div>
    </div>
  );
}
