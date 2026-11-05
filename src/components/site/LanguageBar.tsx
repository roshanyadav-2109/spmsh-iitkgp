"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/cn";
import { PhoneIcon } from "@/components/ui/icons";
import { realPhone, tel } from "@/lib/phone";
import { useLocale, useT } from "@/lib/i18n/I18nProvider";
import {
  HTML_LANG,
  LOCALE_COOKIE,
  LOCALE_NAMES,
  LOCALES,
  type Locale,
} from "@/lib/i18n/locales";

/**
 * The deep navy strip above the header. On the left, from tablet width up,
 * the 24-hour emergency number (the only red on the page) and the ambulance;
 * on the right the four languages, each written in its own script. Choosing
 * one stores it in a cookie for a year and re-renders the page on the server.
 */
export function LanguageBar({
  emergencyPhone,
  ambulancePhone,
}: {
  emergencyPhone?: string;
  ambulancePhone?: string;
} = {}) {
  const emergency = realPhone(emergencyPhone);
  const ambulance = realPhone(ambulancePhone);
  const current = useLocale();
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (locale: Locale) => {
    if (locale === current) return;
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = HTML_LANG[locale];
    startTransition(() => router.refresh());
  };

  return (
    <div data-print="hide" data-surface="dark" className="bg-bar-deep text-white">
      <div className="page-width flex h-10 items-center justify-end gap-3">
        {emergency || ambulance ? (
          <div className="mr-auto hidden items-center gap-4 text-13 sm:flex">
            {emergency ? (
              <a
                href={tel(emergency)}
                className="ui-transition inline-flex h-7 items-center gap-1.5 rounded-full bg-emergency px-3 font-medium text-white no-underline hover:opacity-90"
              >
                <PhoneIcon size={16} />
                <span className="tnum">
                  {t.home.emergency24} &middot; {emergency}
                </span>
              </a>
            ) : null}
            {ambulance ? (
              <a
                href={tel(ambulance)}
                className="tnum text-white no-underline hover:underline"
              >
                {t.footer.ambulance} {ambulance}
              </a>
            ) : null}
          </div>
        ) : null}
        <span className="hidden text-13 text-white sm:inline">{t.language}</span>
        <ul
          role="group"
          aria-label={t.language}
          aria-busy={pending || undefined}
          className="flex items-center gap-1"
        >
          {LOCALES.map((locale) => {
            const active = locale === current;
            return (
              <li key={locale}>
                <button
                  type="button"
                  lang={HTML_LANG[locale]}
                  aria-pressed={active}
                  onClick={() => choose(locale)}
                  className={cn(
                    "ui-transition inline-flex h-8 items-center rounded-full px-3 text-14",
                    active
                      ? "bg-white font-medium text-bar-deep"
                      : "text-white hover:bg-bar-line",
                  )}
                >
                  {LOCALE_NAMES[locale]}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
