import "server-only";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type StaffRole = Database["public"]["Enums"]["staff_role"];

export type StaffProfile = {
  id: string;
  fullName: string;
  role: StaffRole;
  doctorId: string | null;
  email: string;
};

/**
 * Reads the signed-in staff member from the database on every call.
 *
 * The role is never taken from a cookie, a client prop or a cached value. A
 * deactivated account or a changed role therefore takes effect on the next
 * request, not at the next login.
 */
export async function getStaff(): Promise<StaffProfile | null> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("staff_profiles")
    .select("id, full_name, role, doctor_id, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!data || !data.is_active) return null;

  return {
    id: data.id,
    fullName: data.full_name,
    role: data.role,
    doctorId: data.doctor_id,
    email: user.email ?? "",
  };
}

/** The portal home for a role. */
export function homeFor(role: StaffRole): string {
  switch (role) {
    case "tech":
      return "/portal/admin";
    case "reception":
      return "/portal/reception";
    case "doctor":
      return "/portal/doctor";
  }
}

/** Redirects unless the signed-in staff member holds one of these roles. */
export async function requireRole(roles: StaffRole[]): Promise<StaffProfile> {
  const staff = await getStaff();

  if (!staff) {
    // Either not signed in, or signed in against a disabled account. The
    // sign-out and the message are handled on the login page.
    redirect("/login?reason=disabled");
  }

  if (!roles.includes(staff.role)) {
    redirect(homeFor(staff.role));
  }

  return staff;
}

/** Reception and tech. Tech can do everything reception can. */
export async function requireDesk(): Promise<StaffProfile> {
  return requireRole(["reception", "tech"]);
}

export async function requireTech(): Promise<StaffProfile> {
  return requireRole(["tech"]);
}
