import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { PortalShell, type PortalNavItem } from "@/components/portal/PortalShell";
import { ReceptionShortcuts } from "@/components/portal/ReceptionShortcuts";
import { requireDesk } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reception",
  robots: { index: false, follow: false },
};

const NAV: PortalNavItem[] = [
  { href: "/portal/reception", label: "Appointments", exact: true },
  { href: "/portal/reception/availability", label: "Availability" },
  { href: "/portal/reception/doctors", label: "Doctors" },
  { href: "/portal/reception/announcements", label: "Announcements" },
  { href: "/portal/reception/reports", label: "Reports" },
  { href: "/portal/reception/settings", label: "Booking rules" },
];

export default async function ReceptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Re-read from the database on every request. A revoked role takes effect
  // on the next page load, not at the next login.
  const staff = await requireDesk();

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
      <ReceptionShortcuts />
      {children}
    </PortalShell>
  );
}
