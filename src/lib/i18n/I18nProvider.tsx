"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DICTS, type Dict } from "./index";
import { DEFAULT_LOCALE, type Locale } from "./locales";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/**
 * Carries the locale (a plain string) to client components. The dictionaries
 * hold functions, which cannot cross the server/client boundary as props, so
 * each client component looks its strings up here.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT(): Dict {
  return DICTS[useContext(LocaleContext)];
}
