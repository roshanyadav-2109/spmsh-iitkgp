import Link from "next/link";
import { SettingsManager } from "@/components/portal/SettingsManager";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireDesk } from "@/lib/auth";
import { saveBookingSetting } from "./actions";

export const dynamic = "force-dynamic";

export default async function ReceptionSettingsPage() {
  await requireDesk();
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("site_settings")
    .select("key, value, label, is_booking_policy, updated_at")
    .eq("is_booking_policy", true)
    .order("key");

  return (
    <div className="page-width py-8">
      <h1 className="text-26 tracking-tighter">Booking rules</h1>
      <p className="mt-3 max-w-prose text-15 text-muted">
        How far ahead booking is open, when same-day booking closes, and how many
        appointments one phone number may hold. Changes take effect on the next booking.
        Every change is recorded in the audit log against your name.
      </p>

      <div className="mt-8">
        <SettingsManager rows={data ?? []} save={saveBookingSetting} />
      </div>

      <p className="mt-12 text-14 text-muted">
        Contact numbers, the emergency line and the address are changed by technical
        support. Ask them, or see{" "}
        <Link href="/portal/reception">the appointment board</Link>.
      </p>
    </div>
  );
}
