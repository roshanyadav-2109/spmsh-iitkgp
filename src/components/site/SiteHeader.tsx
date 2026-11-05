"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { PRIMARY_NAV, SITE } from "@/lib/site";
import { CalendarIcon, CloseIcon, MenuIcon, PhoneIcon } from "@/components/ui/icons";
import { realPhone, tel } from "@/lib/phone";
import { useT } from "@/lib/i18n/I18nProvider";

const SECONDARY_NAV = [
  { href: "/appointment/status", label: "Check a booking" },
  { href: "/announcements", label: "Notices" },
  { href: "/newsroom", label: "Newsroom" },
];

/**
 * Public site header, in two rows. The top row is sticky: the identity on the
 * left, the emergency number and the booking action as pills on the right.
 * The second row is the section menu, which scrolls away with the page.
 */
export function SiteHeader({
  emergencyPhone,
  opdPhone,
}: {
  emergencyPhone?: string;
  ambulancePhone?: string;
  opdPhone?: string;
}) {
  const pathname = usePathname();
  const t = useT();
  const label = (item: { href: string; label: string }) =>
    t.nav[item.href] ?? item.label;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isCurrent = (item: { href: string; exact?: boolean }) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const emergency = realPhone(emergencyPhone);
  const opd = realPhone(opdPhone);
  // The dark bar leaves out Home (the logo) and Emergency (the red pill above it).
  const sections = PRIMARY_NAV.filter(
    (item) => item.href !== "/" && item.href !== "/emergency",
  );
  // Notices and Newsroom stay in the mobile menu and the footer, not in the bar.
  const barLinks = SECONDARY_NAV.filter(
    (item) => item.href !== "/announcements" && item.href !== "/newsroom",
  );

  return (
    <>
      <header
        data-print="hide"
        className="sticky top-0 z-40 border-b border-line bg-white"
      >
        <div className="page-width flex h-16 items-center justify-between gap-4 lg:h-[76px]">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 no-underline"
            aria-label={`${SITE.name}, ${t.common.home}`}
          >
            <Image
              src="/images/crest.png"
              alt=""
              width={302}
              height={228}
              sizes="56px"
              className="h-9 w-auto shrink-0 lg:h-11"
            />
            <span className="min-w-0 leading-dense">
              <span className="block whitespace-nowrap text-15 font-semibold text-ink sm:hidden">
                SPM Hospital
              </span>
              <span className="hidden text-15 font-semibold text-ink sm:block lg:text-16">
                Dr. Syama Prasad Mookerjee
              </span>
              <span className="block text-12 text-body sm:hidden">IIT Kharagpur</span>
              <span className="hidden text-12 text-body sm:block lg:text-13">
                Superspeciality Hospital &middot; IIT Kharagpur
              </span>
            </span>
          </Link>

          <a
            href="https://www.iitkgp.ac.in"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Indian Institute of Technology Kharagpur (opens in a new tab)"
            className="mr-auto hidden items-center gap-4 border-l border-line pl-5 no-underline lg:flex"
          >
            <Image
              src="/images/iitkgp-crest.png"
              alt=""
              width={327}
              height={369}
              sizes="44px"
              className="h-11 w-auto"
            />
            <span className="text-13 leading-dense text-body">
              Indian Institute of
              <span className="block">Technology Kharagpur</span>
            </span>
          </a>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/book"
              className="ui-transition hidden h-10 items-center gap-2 rounded-full bg-accent px-5 text-14 font-medium text-white no-underline hover:bg-accent-deep md:inline-flex"
            >
              <CalendarIcon size={16} />
              {t.common.book}
            </Link>
            {/* IIT Kharagpur's 75-year mark, beside the booking button. */}
            <Image
              src="/images/iitkgp-75.png"
              alt="IIT Kharagpur, 75 years: Dedicated to the service of the nation, 1951"
              width={239}
              height={240}
              sizes="56px"
              className="hidden h-12 w-auto md:block lg:h-14"
            />
            {opd ? (
              <a
                href={tel(opd)}
                aria-label={t.common.callOpdAria(opd)}
                className="ui-transition inline-flex h-10 w-10 items-center justify-center rounded-full border border-accent text-ink no-underline sm:hidden"
              >
                <PhoneIcon size={18} />
              </a>
            ) : null}
            {emergency ? (
              <a
                href={tel(emergency)}
                aria-label={t.common.callEmergencyN(emergency)}
                className="ui-transition inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-emergency px-3 text-14 font-medium text-white no-underline hover:opacity-90 sm:hidden"
              >
                <PhoneIcon size={16} />
                <span className="tnum">{emergency}</span>
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="main-menu"
              aria-label={open ? t.menuClose : t.menuOpen}
              className="ui-transition inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink lg:hidden"
            >
              {open ? <CloseIcon size={18} /> : <MenuIcon size={18} />}
            </button>
          </div>
        </div>

        {open ? (
          <nav
            id="main-menu"
            aria-label="Main"
            className="border-t border-line lg:hidden"
          >
            <ul className="page-width grid py-2">
              {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isCurrent(item) ? "page" : undefined}
                    className={cn(
                      "block border-b border-line py-3 text-16 no-underline",
                      isCurrent(item) ? "font-medium text-ink" : "text-ink",
                    )}
                  >
                    {label(item)}
                  </Link>
                </li>
              ))}
              <li className="grid gap-2 py-4">
                <Link
                  href="/book"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent text-15 font-medium text-white no-underline"
                >
                  <CalendarIcon size={16} />
                  {t.common.book}
                </Link>
                {emergency ? (
                  <a
                    href={tel(emergency)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emergency text-15 font-medium text-white no-underline"
                  >
                    <PhoneIcon size={16} />
                    {t.common.emergencyN(emergency)}
                  </a>
                ) : null}
              </li>
            </ul>
          </nav>
        ) : null}
      </header>

      <nav
        aria-label="Main"
        data-print="hide"
        data-surface="dark"
        className="hidden bg-bar lg:block"
      >
        <div className="page-width flex h-12 items-stretch justify-between">
          <ul className="flex items-stretch gap-6 xl:gap-7">
            {sections.map((item) => {
              const current = isCurrent(item);
              return (
                <li key={item.href} className="flex">
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "ui-transition flex items-center whitespace-nowrap border-b-2 text-14 font-medium no-underline",
                      current
                        ? "border-highlight text-white"
                        : "border-transparent text-white hover:border-white",
                    )}
                  >
                    {label(item)}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ul className="flex items-center gap-6 whitespace-nowrap text-14">
            {barLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-white no-underline hover:underline"
                >
                  {label(item)}
                </Link>
              </li>
            ))}
            {opd ? (
              <li>
                <a
                  href={tel(opd)}
                  className="tnum text-white no-underline hover:underline"
                >
                  {t.common.opdN(opd)}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </nav>
    </>
  );
}
