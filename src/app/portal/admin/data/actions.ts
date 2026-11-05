"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireTech } from "@/lib/auth";

export type PurgeResult = { ok: boolean; message?: string; rows?: number };

export async function countPurgeable(months: number): Promise<number> {
  await requireTech();
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc("count_purgeable_contacts", { p_months: months });
  return typeof data === "number" ? data : 0;
}

/**
 * Strips phone numbers, institute id numbers and free-text reasons from
 * appointments older than the chosen number of months. The token, date, doctor
 * and outcome remain, so the hospital keeps its record while holding less
 * personal data than it used to.
 *
 * Irreversible, and audited inside the database function itself.
 */
export async function purgeContacts(formData: FormData): Promise<PurgeResult> {
  await requireTech();
  const parsed = z
    .object({
      months: z.coerce.number().int().min(3, "Choose 3 months or more.").max(240),
      confirm: z.literal("PURGE", "Type PURGE to confirm."),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("purge_patient_contacts", {
    p_months: parsed.data.months,
  });

  if (error) {
    return { ok: false, message: "The purge did not run. Nothing was changed." };
  }

  revalidatePath("/portal/admin/data");
  return { ok: true, rows: typeof data === "number" ? data : 0 };
}
