import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { getStaff } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Staff account administration.
 *
 * This is the only place the secret key is used. Holding the key is not
 * authorisation: every request re-reads the caller's own role from the
 * database through their session and refuses anyone who is not `tech`.
 *
 * A reception account reaching this endpoint gets a 403, not a partial result.
 */
async function requireTechCaller() {
  const staff = await getStaff();
  if (!staff || staff.role !== "tech") return null;
  return staff;
}

const createSchema = z.object({
  email: z.string().trim().email("Enter a valid user id, in the form name@domain."),
  password: z.string().min(12, "Use at least 12 characters.").max(200),
  fullName: z.string().trim().min(2, "Enter the staff member's name.").max(120),
  role: z.enum(["tech", "reception", "doctor"]),
  doctorId: z.string().uuid().optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const caller = await requireTechCaller();
  if (!caller) {
    return NextResponse.json(
      { ok: false, message: "Only technical support may create staff accounts." },
      { status: 403 },
    );
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." },
      { status: 400 },
    );
  }

  const input = parsed.data;

  if (input.role === "doctor" && !input.doctorId) {
    return NextResponse.json(
      { ok: false, message: "A doctor account must be linked to a doctor record." },
      { status: 400 },
    );
  }
  if (input.role !== "doctor" && input.doctorId) {
    return NextResponse.json(
      { ok: false, message: "Only a doctor account may be linked to a doctor record." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return NextResponse.json(
      {
        ok: false,
        message: createError?.message?.includes("already")
          ? "An account already exists for that user id."
          : "The account could not be created.",
      },
      { status: 409 },
    );
  }

  const { error: profileError } = await admin.from("staff_profiles").insert({
    id: created.user.id,
    full_name: input.fullName,
    role: input.role,
    doctor_id: input.role === "doctor" ? (input.doctorId as string) : null,
    phone: input.phone || null,
  });

  if (profileError) {
    // Do not leave an auth user with no profile behind: it could sign in and
    // reach a portal with no role.
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      {
        ok: false,
        message:
          "The account could not be created. That doctor record may already be linked to another account.",
      },
      { status: 409 },
    );
  }

  // Audited as the caller, through their own session, not as the secret key.
  const supabase = await createServerSupabase();
  await supabase.rpc("log_audit", {
    p_action: "staff.create",
    p_entity: "staff_profiles",
    p_entity_id: created.user.id,
    p_meta: { email: input.email, role: input.role, by: caller.fullName },
  });

  return NextResponse.json({ ok: true, id: created.user.id }, { status: 201 });
}

const updateSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["reset_password", "set_active", "set_role"]),
  password: z.string().min(12).max(200).optional(),
  isActive: z.boolean().optional(),
  role: z.enum(["tech", "reception", "doctor"]).optional(),
  doctorId: z.string().uuid().optional().or(z.literal("")),
});

export async function PATCH(request: Request) {
  const caller = await requireTechCaller();
  if (!caller) {
    return NextResponse.json(
      { ok: false, message: "Only technical support may change staff accounts." },
      { status: 403 },
    );
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const admin = createAdminClient();
  const supabase = await createServerSupabase();

  if (input.action === "reset_password") {
    if (!input.password) {
      return NextResponse.json(
        { ok: false, message: "Enter a new password of at least 12 characters." },
        { status: 400 },
      );
    }
    const { error } = await admin.auth.admin.updateUserById(input.id, {
      password: input.password,
    });
    if (error) {
      return NextResponse.json(
        { ok: false, message: "The password could not be reset." },
        { status: 500 },
      );
    }
    await supabase.rpc("log_audit", {
      p_action: "staff.reset_password",
      p_entity: "staff_profiles",
      p_entity_id: input.id,
      p_meta: { by: caller.fullName },
    });
    return NextResponse.json({ ok: true });
  }

  if (input.action === "set_active") {
    if (input.id === caller.id && input.isActive === false) {
      return NextResponse.json(
        { ok: false, message: "You cannot disable your own account." },
        { status: 400 },
      );
    }
    const { error } = await admin
      .from("staff_profiles")
      .update({ is_active: input.isActive ?? false })
      .eq("id", input.id);
    if (error) {
      return NextResponse.json(
        { ok: false, message: "The account could not be changed." },
        { status: 500 },
      );
    }
    await supabase.rpc("log_audit", {
      p_action: input.isActive ? "staff.activate" : "staff.deactivate",
      p_entity: "staff_profiles",
      p_entity_id: input.id,
      p_meta: { by: caller.fullName },
    });
    return NextResponse.json({ ok: true });
  }

  // set_role
  if (!input.role) {
    return NextResponse.json({ ok: false, message: "Choose a role." }, { status: 400 });
  }
  if (input.id === caller.id && input.role !== "tech") {
    return NextResponse.json(
      { ok: false, message: "You cannot remove your own technical support role." },
      { status: 400 },
    );
  }

  const { error } = await admin
    .from("staff_profiles")
    .update({
      role: input.role,
      doctor_id: input.role === "doctor" ? input.doctorId || null : null,
    })
    .eq("id", input.id);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "The role could not be changed. A doctor account needs a doctor record that is not already linked.",
      },
      { status: 409 },
    );
  }

  await supabase.rpc("log_audit", {
    p_action: "staff.set_role",
    p_entity: "staff_profiles",
    p_entity_id: input.id,
    p_meta: { role: input.role, by: caller.fullName },
  });

  return NextResponse.json({ ok: true });
}
