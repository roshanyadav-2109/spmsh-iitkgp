import en, { type Dict } from "./en";
import bn from "./bn";
import hi from "./hi";
import te from "./te";
import type { Locale } from "./locales";

export type { Dict };
export const DICTS: Record<Locale, Dict> = { en, bn, hi, te };

/** The plain-language line under a department name, in the reader's language. */
export function glossIn(t: Dict, english: string): string {
  return t.gloss[english] ?? english;
}

/** Day of the week for an ISO date, 0 = Sunday. */
export function weekdayOf(iso: string): number {
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}
