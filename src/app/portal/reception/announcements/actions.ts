"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireDesk } from "@/lib/auth";
import { slugify } from "@/lib/slug";

export type ActionResult = { ok: boolean; message?: string };

const announcementSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(4, "Enter a title.").max(160),
  body: z.string().trim().min(10, "Write the notice.").max(20000),
  category: z.string().trim().max(40).optional().or(z.literal("")),
  is_pinned: z.union([z.literal("on"), z.literal("")]).optional(),
});

export async function saveAnnouncement(formData: FormData): Promise<ActionResult> {
  const staff = await requireDesk();
  const parsed = announcementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the notice.",
    };
  }

  const { id, title, body, category, is_pinned } = parsed.data;
  const supabase = await createServerSupabase();

  const row = {
    title,
    body,
    category: category || null,
    is_pinned: is_pinned === "on",
  };

  if (id) {
    const { error } = await supabase.from("announcements").update(row).eq("id", id);
    if (error) return { ok: false, message: "The notice could not be saved." };
    await supabase.rpc("log_audit", {
      p_action: "announcement.update",
      p_entity: "announcements",
      p_entity_id: id,
      p_meta: { by: staff.fullName },
    });
  } else {
    const base = slugify(title) || "notice";
    let slug = base;
    for (let attempt = 2; attempt < 50; attempt += 1) {
      const { data: clash } = await supabase
        .from("announcements")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!clash) break;
      slug = `${base}-${attempt}`;
    }

    const { data, error } = await supabase
      .from("announcements")
      .insert({ ...row, slug, created_by: staff.id })
      .select("id")
      .single();
    if (error) return { ok: false, message: "The notice could not be created." };
    await supabase.rpc("log_audit", {
      p_action: "announcement.create",
      p_entity: "announcements",
      p_entity_id: data.id,
      p_meta: { slug, by: staff.fullName },
    });
  }

  revalidatePath("/portal/reception/announcements");
  revalidatePath("/announcements");
  return { ok: true };
}

export async function setPublished(formData: FormData): Promise<ActionResult> {
  const staff = await requireDesk();
  const parsed = z
    .object({ id: z.string().uuid(), publish: z.enum(["true", "false"]) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "That notice was not found." };

  const publish = parsed.data.publish === "true";
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("announcements")
    .update({
      is_published: publish,
      // published_at drives the public ordering, so it is set on first publish
      // and left alone afterwards.
      ...(publish ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, message: "The notice could not be changed." };

  await supabase.rpc("log_audit", {
    p_action: publish ? "announcement.publish" : "announcement.unpublish",
    p_entity: "announcements",
    p_entity_id: parsed.data.id,
    p_meta: { by: staff.fullName },
  });

  revalidatePath("/portal/reception/announcements");
  revalidatePath("/announcements");
  return { ok: true };
}
