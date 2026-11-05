"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireDesk } from "@/lib/auth";

export type ActionResult = { ok: boolean; message?: string };

/**
 * Reception may change the booking policy and nothing else.
 *
 * The whitelist is repeated in the RLS policy on site_settings, which only
 * permits an update where is_booking_policy is true. This check exists so the
 * operator gets a sentence rather than a silent refusal, and so a mistake here
 * still cannot widen what reception can reach.
 */
const RECEPTION_EDITABLE = new Set([
  "booking_window_days",
  "same_day_cutoff_minutes",
  "per_phone_daily_limit",
  "per_phone_weekly_limit",
  "public_cancel_cutoff_minutes",
  "overflow_booking_enabled",
]);

const NUMERIC_BOUNDS: Record<string, { min: number; max: number }> = {
  booking_window_days: { min: 0, max: 60 },
  same_day_cutoff_minutes: { min: 0, max: 720 },
  per_phone_daily_limit: { min: 1, max: 20 },
  per_phone_weekly_limit: { min: 1, max: 60 },
  public_cancel_cutoff_minutes: { min: 0, max: 1440 },
};

export async function saveBookingSetting(formData: FormData): Promise<ActionResult> {
  const staff = await requireDesk();
  const parsed = z
    .object({ key: z.string().min(1).max(80), value: z.string().max(200) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, message: "That setting could not be saved." };

  const { key, value } = parsed.data;

  if (!RECEPTION_EDITABLE.has(key)) {
    return {
      ok: false,
      message: "Only technical support can change that setting.",
    };
  }

  const bounds = NUMERIC_BOUNDS[key];
  if (bounds) {
    const number = Number.parseInt(value, 10);
    if (Number.isNaN(number) || number < bounds.min || number > bounds.max) {
      return {
        ok: false,
        message: `Enter a whole number between ${bounds.min} and ${bounds.max}.`,
      };
    }
  }
  if (key === "overflow_booking_enabled" && !["true", "false"].includes(value)) {
    return { ok: false, message: "Choose on or off." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("site_settings")
    .update({ value, updated_by: staff.id, updated_at: new Date().toISOString() })
    .eq("key", key);

  if (error) return { ok: false, message: "That setting could not be saved." };

  await supabase.rpc("log_audit", {
    p_action: "settings.update",
    p_entity: "site_settings",
    p_entity_id: key,
    p_meta: { value, by: staff.fullName },
  });

  revalidatePath("/portal/reception/settings");
  revalidatePath("/book");
  return { ok: true };
}
