import { redirect } from "next/navigation";
import { getStaff, homeFor } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalIndex() {
  const staff = await getStaff();
  if (!staff) redirect("/login?reason=disabled");
  redirect(homeFor(staff.role));
}
