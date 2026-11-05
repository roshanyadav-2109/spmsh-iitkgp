"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireDesk } from "@/lib/auth";

export type ActionResult = {
  ok: boolean;
  message?: string;
  callList?: CallListEntry[];
};

export type CallListEntry = {
  booking_ref: string;
  token_label: string;
  slot_time: string | null;
  patient_name: string;
  patient_phone: string;
  patient_type: string;
};

const time = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Use 24-hour time, like 09:00.");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.");

// ---------------------------------------------------------------- schedules

const scheduleSchema = z
  .object({
    id: z.string().uuid().optional().or(z.literal("")),
    doctor_id: z.string().uuid(),
    weekday: z.coerce.number().int().min(0).max(6),
    start_time: time,
    end_time: time,
    slot_minutes: z.coerce.number().int().min(5).max(60),
    max_patients: z.coerce.number().int().min(1).max(200),
    room_no: z.string().trim().max(40).optional().or(z.literal("")),
  })
  .refine((value) => value.end_time > value.start_time, {
    path: ["end_time"],
    message: "The end time must be after the start time.",
  });

export async function saveSchedule(formData: FormData): Promise<ActionResult> {
  const staff = await requireDesk();
  const parsed = scheduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the session.",
    };
  }

  const { id, ...fields } = parsed.data;
  const supabase = await createServerSupabase();
  const row = { ...fields, room_no: fields.room_no || null };

  const { error } = id
    ? await supabase.from("doctor_schedules").update(row).eq("id", id)
    : await supabase.from("doctor_schedules").insert(row);

  if (error) {
    return {
      ok: false,
      message:
        "That session could not be saved. A doctor may hold only one active session per weekday.",
    };
  }

  await supabase.rpc("log_audit", {
    p_action: id ? "schedule.update" : "schedule.create",
    p_entity: "doctor_schedules",
    p_entity_id: id || fields.doctor_id,
    p_meta: { ...row, by: staff.fullName },
  });

  revalidatePath("/portal/reception/availability");
  return { ok: true };
}

export async function deactivateSchedule(formData: FormData): Promise<ActionResult> {
  const staff = await requireDesk();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "That session was not found." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("doctor_schedules")
    .update({ is_active: false })
    .eq("id", id.data);

  if (error) return { ok: false, message: "The session could not be removed." };

  await supabase.rpc("log_audit", {
    p_action: "schedule.deactivate",
    p_entity: "doctor_schedules",
    p_entity_id: id.data,
    p_meta: { by: staff.fullName },
  });

  revalidatePath("/portal/reception/availability");
  return { ok: true };
}

// --------------------------------------------------------------- exceptions

const exceptionSchema = z
  .object({
    doctor_id: z.string().uuid(),
    on_date: isoDate,
    kind: z.enum(["holiday", "cancelled", "modified", "extra"]),
    start_time: z.string().optional().or(z.literal("")),
    end_time: z.string().optional().or(z.literal("")),
    max_patients: z.string().optional().or(z.literal("")),
    reason: z.string().trim().min(3, "State a reason.").max(200),
  })
  .refine(
    (value) =>
      value.kind === "holiday" ||
      value.kind === "cancelled" ||
      (Boolean(value.start_time) && Boolean(value.end_time)),
    { path: ["start_time"], message: "A changed or extra session needs both timings." },
  );

export async function saveException(formData: FormData): Promise<ActionResult> {
  const staff = await requireDesk();
  const parsed = exceptionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the entry.",
    };
  }

  const value = parsed.data;
  const supabase = await createServerSupabase();

  // Created at the desk, so it is approved on the spot. A doctor's own request
  // arrives unapproved and waits in the pending queue below.
  const { error } = await supabase.from("schedule_exceptions").upsert(
    {
      doctor_id: value.doctor_id,
      on_date: value.on_date,
      kind: value.kind,
      start_time: value.start_time || null,
      end_time: value.end_time || null,
      max_patients: value.max_patients ? Number(value.max_patients) : null,
      reason: value.reason,
      created_by: staff.id,
      approved_by: staff.id,
      approved_at: new Date().toISOString(),
    },
    { onConflict: "doctor_id,on_date,kind" },
  );

  if (error) return { ok: false, message: "That entry could not be saved." };

  await supabase.rpc("log_audit", {
    p_action: "exception.save",
    p_entity: "schedule_exceptions",
    p_entity_id: `${value.doctor_id}:${value.on_date}`,
    p_meta: { ...value, by: staff.fullName },
  });

  revalidatePath("/portal/reception/availability");
  return { ok: true };
}

export async function approveException(formData: FormData): Promise<ActionResult> {
  const staff = await requireDesk();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "That request was not found." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("schedule_exceptions")
    .update({ approved_by: staff.id, approved_at: new Date().toISOString() })
    .eq("id", id.data);

  if (error) return { ok: false, message: "The request could not be approved." };

  await supabase.rpc("log_audit", {
    p_action: "exception.approve",
    p_entity: "schedule_exceptions",
    p_entity_id: id.data,
    p_meta: { by: staff.fullName },
  });

  revalidatePath("/portal/reception/availability");
  return { ok: true };
}

export async function deleteException(formData: FormData): Promise<ActionResult> {
  const staff = await requireDesk();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "That entry was not found." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("schedule_exceptions")
    .delete()
    .eq("id", id.data);
  if (error) return { ok: false, message: "The entry could not be removed." };

  await supabase.rpc("log_audit", {
    p_action: "exception.delete",
    p_entity: "schedule_exceptions",
    p_entity_id: id.data,
    p_meta: { by: staff.fullName },
  });

  revalidatePath("/portal/reception/availability");
  return { ok: true };
}

// ---------------------------------------------------- cancelling a session

/**
 * Cancels every live appointment on a session and hands back the list of
 * people to telephone. The database does the work in one transaction so a
 * half-cancelled session cannot exist.
 */
export async function cancelSession(formData: FormData): Promise<ActionResult> {
  await requireDesk();
  const parsed = z
    .object({
      doctor_id: z.string().uuid(),
      on_date: isoDate,
      reason: z.string().trim().min(3, "State why the session is cancelled.").max(200),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the entry.",
    };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("cancel_session", {
    p_doctor_id: parsed.data.doctor_id,
    p_on_date: parsed.data.on_date,
    p_reason: parsed.data.reason,
  });

  if (error) {
    return { ok: false, message: "The session could not be cancelled." };
  }

  revalidatePath("/portal/reception/availability");
  revalidatePath("/portal/reception");
  return { ok: true, callList: (data ?? []) as CallListEntry[] };
}

/** How many people a cancellation would affect, shown before confirming. */
export async function countAffected(doctorId: string, onDate: string): Promise<number> {
  await requireDesk();
  const supabase = await createServerSupabase();
  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("doctor_id", doctorId)
    .eq("on_date", onDate)
    .not("status", "in", "(cancelled,attended,no_show)");
  return count ?? 0;
}

// ----------------------------------------------------------------- holidays

export async function addHoliday(formData: FormData): Promise<ActionResult> {
  const staff = await requireDesk();
  const parsed = z
    .object({
      on_date: isoDate,
      reason: z.string().trim().min(3, "State the reason for the closure.").max(200),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the entry.",
    };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("hospital_holidays")
    .upsert({ ...parsed.data, created_by: staff.id }, { onConflict: "on_date" });

  if (error) return { ok: false, message: "The closure could not be saved." };

  await supabase.rpc("log_audit", {
    p_action: "holiday.add",
    p_entity: "hospital_holidays",
    p_entity_id: parsed.data.on_date,
    p_meta: { reason: parsed.data.reason, by: staff.fullName },
  });

  revalidatePath("/portal/reception/availability");
  return { ok: true };
}

export async function removeHoliday(formData: FormData): Promise<ActionResult> {
  const staff = await requireDesk();
  const parsed = isoDate.safeParse(formData.get("on_date"));
  if (!parsed.success) return { ok: false, message: "That date was not found." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("hospital_holidays")
    .delete()
    .eq("on_date", parsed.data);

  if (error) return { ok: false, message: "The closure could not be removed." };

  await supabase.rpc("log_audit", {
    p_action: "holiday.remove",
    p_entity: "hospital_holidays",
    p_entity_id: parsed.data,
    p_meta: { by: staff.fullName },
  });

  revalidatePath("/portal/reception/availability");
  return { ok: true };
}
