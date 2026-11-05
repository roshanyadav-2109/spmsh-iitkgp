import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { PortalShell, type PortalNavItem } from "@/components/portal/PortalShell";
import { requireTech } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const NAV: PortalNavItem[] = [
  { href: "/portal/admin", label: "Overview", exact: true },
  { href: "/portal/admin/staff", label: "Staff accounts" },
  { href: "/portal/admin/settings", label: "Site settings" },
  { href: "/portal/admin/audit", label: "Audit log" },
  { href: "/portal/admin/data", label: "Data tools" },
  { href: "/portal/reception", label: "Reception portal" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireTech();
  return (
    <PortalShell
      staff={staff}
      nav={NAV}
      primaryAction={
        <ButtonLink href="/portal/reception/book" variant="primary">
          Book appointment
        </ButtonLink>
      }
    >
      {children}
    </PortalShell>
  );
}
