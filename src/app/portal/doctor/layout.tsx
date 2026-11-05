import type { Metadata } from "next";
import { PortalShell, type PortalNavItem } from "@/components/portal/PortalShell";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Doctor",
  robots: { index: false, follow: false },
};

const NAV: PortalNavItem[] = [
  { href: "/portal/doctor", label: "Today", exact: true },
  { href: "/portal/doctor/schedule", label: "My schedule" },
];

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireRole(["doctor"]);
  return (
    <PortalShell staff={staff} nav={NAV}>
      {children}
    </PortalShell>
  );
}
