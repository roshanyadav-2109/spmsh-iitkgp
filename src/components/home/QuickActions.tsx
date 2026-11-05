import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDisc } from "@/components/ui/Go";
import { TASK_ICONS } from "@/lib/lineIcons";
import { realPhone, tel } from "@/lib/phone";
import { getT } from "@/lib/i18n/server";

const icon = (src: string) => (
  <Image src={src} alt="" width={192} height={192} sizes="48px" className="h-12 w-12" />
);

type Action = {
  href: string;
  label: string;
  icon: ReactNode;
  /** A second line under the label: the OPD hours, the emergency link. */
  detail?: ReactNode;
  /** tel: links are plain anchors, not client-side navigation. */
  external?: boolean;
};

/**
 * The five things people come for, as cut-corner blocks: the mark at the top
 * left, the label under it, the arrow disc in the bitten corner. The emergency
 * block dials the number itself; the timings block carries the OPD hours.
 */
export async function QuickActions({
  emergencyPhone,
  opdHours,
}: {
  emergencyPhone?: string | null;
  opdHours?: string | null;
}) {
  const emergency = realPhone(emergencyPhone);
  const t = await getT();

  const actions: Action[] = [
    { href: "/book", label: t.common.book, icon: icon(TASK_ICONS.book) },
    { href: "/doctors", label: t.common.findDoctor, icon: icon(TASK_ICONS.findDoctor) },
    {
      href: "/appointment/status",
      label: t.common.checkCancel,
      icon: icon(TASK_ICONS.checkBooking),
    },
    emergency
      ? {
          href: tel(emergency),
          external: true,
          label: t.common.callEmergencyN(emergency),
          icon: icon(TASK_ICONS.emergency),
        }
      : {
          href: "/emergency",
          label: t.home.emergency24,
          icon: icon(TASK_ICONS.emergency),
        },
    {
      href: "/contact",
      label: t.home.timings,
      icon: icon(TASK_ICONS.directions),
      detail: opdHours ? <span className="tnum">{t.common.opdN(opdHours)}</span> : null,
    },
  ];

  return (
    <section aria-label={t.home.quickActions} className="pb-10 pt-6 lg:pb-12 lg:pt-10">
      <ul className="page-width grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 lg:gap-5">
        {actions.map((action, index) => {
          const body = (
            <>
              <span className="notch-tr ui-transition flex h-full min-h-28 flex-col gap-3 rounded-lg bg-tint p-4 sm:min-h-32 sm:p-5">
                <span aria-hidden="true">{action.icon}</span>
                <span className="pr-6 text-15 font-medium leading-dense text-balance text-ink sm:text-16">
                  {action.label}
                  {action.detail ? (
                    <span className="mt-1 block text-13 font-normal text-body">
                      {action.detail}
                    </span>
                  ) : null}
                </span>
              </span>
              <ArrowDisc className="absolute right-0 top-0" />
            </>
          );
          const className = "group relative block h-full no-underline";
          return (
            <li
              key={action.label}
              className={
                index === actions.length - 1 ? "col-span-2 sm:col-span-1" : undefined
              }
            >
              {action.external ? (
                <a href={action.href} className={className}>
                  {body}
                </a>
              ) : (
                <Link href={action.href} className={className}>
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
