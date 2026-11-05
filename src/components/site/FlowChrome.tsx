import Image from "next/image";
import Link from "next/link";
import { PhoneIcon } from "@/components/ui/icons";
import { SITE } from "@/lib/site";
import { getSettings } from "@/lib/settings";
import { realPhone, tel } from "@/lib/phone";
import { getT } from "@/lib/i18n/server";
import { LanguageBar } from "@/components/site/LanguageBar";

/**
 * Stripped chrome for /book, /appointment/status and /login: identity, the
 * OPD help number and the emergency number, no navigation. The crest links
 * home. Same identity and pills as the main site header.
 */
export async function FlowChrome({ children }: { children: React.ReactNode }) {
  const [settings, t] = await Promise.all([getSettings(), getT()]);
  const opd = realPhone(settings.reception_phone);
  const emergency = realPhone(settings.emergency_phone);

  return (
    <>
      <LanguageBar />
      <header data-print="hide" className="border-b border-line bg-white">
        <div className="page-width flex h-16 items-center justify-between gap-3 lg:h-[76px]">
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
              <span className="block truncate text-15 font-semibold text-ink sm:hidden">
                SPM Hospital
              </span>
              <span className="hidden truncate text-16 font-semibold text-ink sm:block">
                Dr. Syama Prasad Mookerjee
              </span>
              <span className="block truncate text-12 text-body lg:text-13">
                <span className="hidden sm:inline">
                  Superspeciality Hospital &middot;{" "}
                </span>
                IIT Kharagpur
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            {opd ? (
              <a
                href={tel(opd)}
                aria-label={t.flow.helpAria(opd)}
                className="ui-transition inline-flex h-10 items-center gap-2 rounded-full border border-accent px-3 text-14 font-medium text-ink no-underline sm:px-4"
              >
                <PhoneIcon size={16} />
                <span aria-hidden="true" className="hidden sm:inline">
                  {t.flow.help} <span className="tnum">{opd}</span>
                </span>
              </a>
            ) : null}
            {emergency ? (
              <a
                href={tel(emergency)}
                aria-label={t.common.callEmergencyN(emergency)}
                className="ui-transition inline-flex h-10 items-center gap-1.5 rounded-full bg-emergency px-3 text-14 font-medium text-white no-underline hover:opacity-90 sm:px-4"
              >
                <PhoneIcon size={16} />
                <span className="tnum">
                  <span className="hidden sm:inline">{t.common.emergency} </span>
                  {emergency}
                </span>
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <main id="main" className="flex-1 bg-white">
        {children}
      </main>

      <footer data-print="hide" className="border-t border-line bg-white">
        <div className="page-width flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-5 text-13 text-body">
          <p>&copy; {SITE.name}, IIT Kharagpur</p>
          <p>{t.flow.ist}</p>
        </div>
      </footer>
    </>
  );
}
