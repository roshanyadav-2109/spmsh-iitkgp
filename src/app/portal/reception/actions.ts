"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireDesk } from "@/lib/auth";
import { PATIENT_SEXES, PATIENT_TYPES } from "@/lib/booking/schema";

export type ActionResult = { ok: boolean; message?: string };

/**
 * Every action here re-checks the role server-side before it touches anything.
 * RLS would refuse an unauthorised write anyway; this makes the refusal
 * explicit and gives the operator a sentence rather than a silent no-op.
 */

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["booked", "arrived", "attended", "no_show"]),
});

export async function setAppointmentStatus(formData: FormData): Promise<ActionResult> {
  const staff = await requireDesk();
  const parsed = statusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { ok: false, message: "That status is not valid." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("appointments")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, message: "The status could not be changed." };

  await supabase.rpc("log_audit", {
    p_action: `appointment.status.${parsed.data.status}`,
    p_entity: "appointments",
    p_entity_id: parsed.data.id,
    p_meta: { by: staff.fullName },
  });

  revalidatePath("/portal/reception");
  revalidatePath("/portal/doctor");
  return { ok: true };
}

const cancelSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().min(3, "State why the appointment is cancelled.").max(200),
});

export async function cancelAppointment(formData: FormData): Promise<ActionResult> {
  const staff = await requireDesk();
  const parsed = cancelSchema.safeParse({
    id: formData.get("id"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "A reason is required.",
    };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled", cancel_reason: parsed.data.reason })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, message: "The appointment could not be cancelled." };

  await supabase.rpc("log_audit", {
    p_action: "appointment.cancel",
    p_entity: "appointments",
    p_entity_id: parsed.data.id,
    p_meta: { reason: parsed.data.reason, by: staff.fullName },
  });

  revalidatePath("/portal/reception");
  return { ok: true };
}

const patientSchema = z.object({
  id: z.string().uuid(),
  patient_name: z.string().trim().min(2).max(120),
  patient_age: z.coerce.number().int().min(0).max(120),
  patient_sex: z.enum(PATIENT_SEXES),
  patient_phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number."),
  patient_type: z.enum(PATIENT_TYPES),
  patient_id_no: z.string().trim().max(40).optional().or(z.literal("")),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
});

export async function updatePatientDetails(formData: FormData): Promise<ActionResult> {
  const staff = await requireDesk();
  const parsed = patientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the patient details.",
    };
  }

  const { id, ...fields } = parsed.data;
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("appointments")
    .update({
      ...fields,
      patient_id_no: fields.patient_id_no || null,
      reason: fields.reason || null,
    })
    .eq("id", id);

  if (error) {
    // The patient_id_required constraint is the likely cause.
    return {
      ok: false,
      message:
        "The details could not be saved. Students, staff and faculty need a roll or employee number.",
    };
  }

  await supabase.rpc("log_audit", {
    p_action: "appointment.edit",
    p_entity: "appointments",
    p_entity_id: id,
    p_meta: { by: staff.fullName },
  });

  revalidatePath("/portal/reception");
  return { ok: true };
}
