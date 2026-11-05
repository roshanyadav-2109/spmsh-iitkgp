import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Bypasses row level security entirely.
 *
 * Import this from route handlers and server actions only, and only for
 * staff-account administration, which needs the Auth admin API. The
 * `server-only` import above turns a stray client-side import into a build
 * error rather than a key leak.
 *
 * Every caller must check `auth_role() = 'tech'` against the *user's* session
 * before using this client. Holding the secret key is not authorisation.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
