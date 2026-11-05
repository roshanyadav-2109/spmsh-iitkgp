import { cookies } from "next/headers";
import { DICTS, type Dict } from "./index";
import { LOCALE_COOKIE, toLocale, type Locale } from "./locales";

/** The reader's language, from the cookie the language bar sets. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return toLocale(store.get(LOCALE_COOKIE)?.value);
}

export async function getT(): Promise<Dict> {
  return DICTS[await getLocale()];
}
