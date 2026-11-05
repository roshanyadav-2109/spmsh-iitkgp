"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export type ActionResult = { ok: boolean; message?: string };

/**
 * A doctor may set the status and the remarks on their own patients, and
 * nothing else. That is enforced three times over: RLS restricts which rows,
 * a database trigger restricts which columns, and these actions only ever
 * send those two fields.
 */

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["arrived", "attended", "no_show", "booked"]),
});

export async function setOwnStatus(formData: FormData): Promise<ActionResult> {
  const staff = await requireRole(["doctor"]);
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "That status is not valid." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("appointments")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .eq("doctor_id", staff.doctorId ?? "");

  if (error) {
    return {
      ok: false,
      message: "That could not be saved. Cancellation is done at the reception desk.",
    };
  }

  await supabase.rpc("log_audit", {
    p_action: `appointment.status.${parsed.data.status}`,
    p_entity: "appointments",
    p_entity_id: parsed.data.id,
    p_meta: { by: staff.fullName, role: "doctor" },
  });

  revalidatePath("/portal/doctor");
  return { ok: true };
}

const remarksSchema = z.object({
  id: z.string().uuid(),
  remarks: z.string().trim().max(2000),
});

export async function saveRemarks(formData: FormData): Promise<ActionResult> {
  const staff = await requireRole(["doctor"]);
  const parsed = remarksSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "The remarks could not be saved." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("appointments")
    .update({ doctor_remarks: parsed.data.remarks || null })
    .eq("id", parsed.data.id)
    .eq("doctor_id", staff.doctorId ?? "");

  if (error) return { ok: false, message: "The remarks could not be saved." };

  revalidatePath("/portal/doctor");
  return { ok: true };
}

/**
 * A leave request, not a cancellation. It has no effect on booking until
 * reception approves it, because somebody has to telephone the patients who
 * are already booked.
 */
export async function requestLeave(formData: FormData): Promise<ActionResult> {
  const staff = await requireRole(["doctor"]);
  const parsed = z
    .object({
      on_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
      reason: z.string().trim().min(3, "State a reason.").max(200),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the request.",
    };
  }
  if (!staff.doctorId) {
    return { ok: false, message: "This account is not linked to a doctor record." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("schedule_exceptions").insert({
    doctor_id: staff.doctorId,
    on_date: parsed.data.on_date,
    kind: "holiday",
    reason: parsed.data.reason,
    created_by: staff.id,
  });

  if (error) {
    return {
      ok: false,
      message: "The request could not be sent. There may already be one for that date.",
    };
  }

  revalidatePath("/portal/doctor/schedule");
  revalidatePath("/portal/reception/availability");
  return { ok: true };
}
