import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Anonymous, cookie-free client for public pages.
 *
 * Deliberately does not touch `cookies()`: reading cookies would opt every
 * public page into dynamic rendering. Public information pages carry no
 * session, so they stay statically renderable and revalidate on a timer.
 *
 * Never use this inside the portal.
 */
/**
 * Public reads (departments, doctors, schedules, services, notices, settings)
 * are kept in Next's data cache for a minute, so a page visit does not wait
 * on a round trip to the database every time. Only GET reads are cached;
 * RPC calls and anything that writes go straight through. Live booking data
 * (available dates, bookings) is read from the browser client, not here.
 */
const PUBLIC_DATA_SECONDS = 60;

const cachedFetch: typeof fetch = (input, init) => {
  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") return fetch(input, init);
  return fetch(input, {
    ...init,
    next: { revalidate: PUBLIC_DATA_SECONDS, tags: ["public-data"] },
  });
};

export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.",
    );
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: cachedFetch },
  });
}
