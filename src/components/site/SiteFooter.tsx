import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL_LINKS, SITE } from "@/lib/site";
import { realPhone, tel } from "@/lib/phone";
import { SettingPhone, SettingValue } from "@/components/SettingValue";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n/server";
import { todayIST } from "@/lib/dates";

/** The policies listed under Site Information; the rest are on /site-map. */
const SITE_INFO = ["/site-map", "/privacy", "/terms", "/accessibility", "/cookies"];

/**
 * A white footer in four columns. Each column holds one or two groups: a bold
 * heading and plain links under it. A rule, then the institute's mark and the
 * copyright line.
 */
function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <nav aria-label={label}>
      <h2 className="font-sans text-18 font-semibold tracking-normal text-ink">
        {label}
      </h2>
      <div className="mt-3">{children}</div>
    </nav>
  );
}

export async function SiteFooter() {
  const [settings, t] = await Promise.all([getSettings(), getT()]);
  const emergency = realPhone(settings.emergency_phone);

  const label = (href: string, fallback: string) =>
    href === "/contact"
      ? t.contactShort
      : href === "/doctors"
        ? t.findDoctorNav
        : (t.nav[href] ?? fallback);

  const links = (items: { href: string; label: string }[]) => (
    <ul className="grid gap-2 text-16">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="tracking-[0.01em] text-ink no-underline hover:underline"
          >
            {label(item.href, item.label)}
          </Link>
        </li>
      ))}
    </ul>
  );

  const phones = [
    { label: t.footer.ambulance, value: settings.ambulance_phone },
    { label: t.footer.opdCounter, value: settings.reception_phone },
    { label: t.footer.frontDesk, value: settings.front_desk_phone },
    { label: t.footer.office, value: settings.office_phone },
  ];

  return (
    <footer data-print="hide" className="bg-tint-neutral text-ink">
      <div className="page-width grid gap-x-10 gap-y-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:py-14">
        <div className="grid content-start gap-10">
          <Group label={t.footer.deptServices}>
            {links([
              { href: "/departments", label: "Departments" },
              { href: "/doctors", label: "Find a doctor" },
              { href: "/services", label: "Services" },
              { href: "/emergency", label: "Emergency" },
            ])}
          </Group>
          <Group label={t.footer.contact}>
            <ul className="grid gap-2 text-16">
              {phones.map((phone) => (
                <li key={phone.label} className="tracking-[0.01em]">
                  {phone.label}:{" "}
                  <span className="tnum">
                    <SettingPhone value={phone.value} className="text-ink" />
                  </span>
                </li>
              ))}
            </ul>
          </Group>
        </div>

        <div className="grid content-start gap-10">
          <Group label={t.footer.patientsVisitors}>
            {links([
              { href: "/book", label: "Book OPD appointment" },
              { href: "/appointment/status", label: "Check a booking" },
              { href: "/contact", label: "Contact and timings" },
              { href: "/announcements", label: "Notices" },
            ])}
          </Group>
        </div>

        <div className="grid content-start gap-10">
          <Group label={t.footer.about}>
            {links([
              { href: "/about", label: "About" },
              { href: "/administration", label: "Administration" },
              { href: "/newsroom", label: "Newsroom" },
              { href: "/login", label: "Staff login" },
            ])}
          </Group>
          <Group label={t.footer.siteInfo}>
            {links(LEGAL_LINKS.filter((item) => SITE_INFO.includes(item.href)))}
          </Group>
        </div>

        <div className="grid content-start gap-10">
          <Group label={t.footer.visitUs}>
            <address className="text-16 not-italic leading-[1.6] tracking-[0.01em]">
              <SettingValue value={settings.hospital_address} />
            </address>
            <p className="tnum mt-3 text-16">
              {t.common.opdN(settings.opd_hours_short ?? "")}
            </p>
            <a
              href={settings.map_embed_url ?? "/contact"}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-16 text-ink"
            >
              {t.footer.directions}
            </a>
            {emergency ? (
              <p className="mt-5 text-16 font-semibold">
                <a
                  href={tel(emergency)}
                  className="tnum text-emergency no-underline hover:underline"
                >
                  {t.common.emergencyN(emergency)}
                </a>
              </p>
            ) : null}
          </Group>
        </div>
      </div>

      <div className="page-width">
        <div className="border-t border-ink py-8">
          <a
            href="https://www.iitkgp.ac.in"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-fit no-underline"
          >
            <span className="block text-14 text-ink">{t.footer.hospitalOf}</span>
            <Image
              src="/images/iitkgp-logo.png"
              alt="Indian Institute of Technology Kharagpur"
              width={524}
              height={123}
              sizes="200px"
              className="mt-2 h-12 w-auto"
            />
          </a>
        </div>
      </div>

      {/* Black sub-footer: the copyright line only. */}
      <div data-surface="dark" className="bg-bar-deep">
        <p className="page-width py-5 text-center text-14 text-white">
          &copy; {todayIST().slice(0, 4)} {SITE.name}. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
