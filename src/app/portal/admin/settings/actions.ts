"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireTech } from "@/lib/auth";

export type ActionResult = { ok: boolean; message?: string };

const schema = z.object({
  key: z.string().min(1).max(80),
  value: z.string().max(2000),
});

/** Technical support may change any setting, including contact details. */
export async function saveAnySetting(formData: FormData): Promise<ActionResult> {
  const staff = await requireTech();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, message: "That setting could not be saved." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("site_settings")
    .update({
      value: parsed.data.value,
      updated_by: staff.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", parsed.data.key);

  if (error) return { ok: false, message: "That setting could not be saved." };

  await supabase.rpc("log_audit", {
    p_action: "settings.update",
    p_entity: "site_settings",
    p_entity_id: parsed.data.key,
    p_meta: { value: parsed.data.value, by: staff.fullName },
  });

  revalidatePath("/portal/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}
