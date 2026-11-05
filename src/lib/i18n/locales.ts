/**
 * The four languages the public site speaks. The choice is kept in a cookie,
 * so the server renders the page in it and there is no flash of English.
 * Doctor, department and service names, notices and the hero quotation stay
 * as the hospital wrote them.
 */
export const LOCALES = ["en", "bn", "hi", "te"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "spm-lang";

/** Each language named in its own script, so people can find theirs. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  bn: "বাংলা",
  hi: "हिन्दी",
  te: "తెలుగు",
};

/** BCP 47 tags for <html lang>, so screen readers and fonts pick the script. */
export const HTML_LANG: Record<Locale, string> = {
  en: "en-IN",
  bn: "bn-IN",
  hi: "hi-IN",
  te: "te-IN",
};

export function toLocale(value: string | undefined | null): Locale {
  return (LOCALES as readonly string[]).includes(value ?? "")
    ? (value as Locale)
    : DEFAULT_LOCALE;
}
