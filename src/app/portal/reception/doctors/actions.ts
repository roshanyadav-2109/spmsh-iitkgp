"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireDesk } from "@/lib/auth";
import { slugify } from "@/lib/slug";

export type ActionResult = { ok: boolean; message?: string };

const doctorSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  full_name: z.string().trim().min(2, "Enter the doctor's name.").max(120),
  department_id: z.string().uuid().optional().or(z.literal("")),
  designation: z.string().trim().max(120).optional().or(z.literal("")),
  qualifications: z.string().trim().max(200).optional().or(z.literal("")),
  registration_no: z.string().trim().max(60).optional().or(z.literal("")),
  room_no: z.string().trim().max(40).optional().or(z.literal("")),
  about: z.string().trim().max(2000).optional().or(z.literal("")),
  /* A path inside the bucket, or a full https URL to a photograph hosted
     elsewhere. http is refused: the optimizer will not fetch it, so accepting
     it here would store a value that can only ever render as a broken frame.
     600 rather than 300 because signed and query-stringed image URLs are long. */
  photo_path: z
    .string()
    .trim()
    .max(600)
    .refine((v) => v === "" || !/^http:\/\//i.test(v), {
      message: "Use an https link, or a path inside the bucket.",
    })
    .optional()
    .or(z.literal("")),
  display_order: z.coerce.number().int().min(0).max(9999).optional(),
});

export async function saveDoctor(formData: FormData): Promise<ActionResult> {
  const staff = await requireDesk();
  const parsed = doctorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the details.",
    };
  }

  const { id, ...fields } = parsed.data;
  const supabase = await createServerSupabase();

  const row = {
    full_name: fields.full_name,
    department_id: fields.department_id || null,
    designation: fields.designation || null,
    qualifications: fields.qualifications || null,
    registration_no: fields.registration_no || null,
    room_no: fields.room_no || null,
    about: fields.about || null,
    photo_path: fields.photo_path || null,
    display_order: fields.display_order ?? 0,
  };

  if (id) {
    const { error } = await supabase.from("doctors").update(row).eq("id", id);
    if (error) return { ok: false, message: "The doctor record could not be saved." };
    await supabase.rpc("log_audit", {
      p_action: "doctor.update",
      p_entity: "doctors",
      p_entity_id: id,
      p_meta: { by: staff.fullName },
    });
  } else {
    // A slug collision is possible for two doctors with the same name, so the
    // second one gets a numeric suffix rather than an error at the counter.
    const base = slugify(fields.full_name) || "doctor";
    let slug = base;
    for (let attempt = 2; attempt < 50; attempt += 1) {
      const { data: clash } = await supabase
        .from("doctors")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!clash) break;
      slug = `${base}-${attempt}`;
    }

    const { data, error } = await supabase
      .from("doctors")
      .insert({ ...row, slug })
      .select("id")
      .single();
    if (error) return { ok: false, message: "The doctor record could not be created." };
    await supabase.rpc("log_audit", {
      p_action: "doctor.create",
      p_entity: "doctors",
      p_entity_id: data.id,
      p_meta: { slug, by: staff.fullName },
    });
  }

  revalidatePath("/portal/reception/doctors");
  revalidatePath("/doctors");
  return { ok: true };
}

/**
 * Doctors are never hard-deleted. Historical appointments reference the row,
 * and a deleted doctor would take the record of who saw whom with it.
 */
export async function setDoctorActive(formData: FormData): Promise<ActionResult> {
  const staff = await requireDesk();
  const parsed = z
    .object({ id: z.string().uuid(), active: z.enum(["true", "false"]) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "That doctor was not found." };

  const isActive = parsed.data.active === "true";
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("doctors")
    .update({ is_active: isActive })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, message: "The record could not be changed." };

  await supabase.rpc("log_audit", {
    p_action: isActive ? "doctor.activate" : "doctor.deactivate",
    p_entity: "doctors",
    p_entity_id: parsed.data.id,
    p_meta: { by: staff.fullName },
  });

  revalidatePath("/portal/reception/doctors");
  revalidatePath("/doctors");
  return { ok: true };
}
