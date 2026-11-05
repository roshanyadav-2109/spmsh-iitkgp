import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Cookie-backed client for the staff portal. Uses @supabase/ssr, not the
 * deprecated auth-helpers.
 *
 * Server components cannot set cookies, so `setAll` is written to tolerate the
 * throw. Token refresh is handled in middleware, which can set them.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a server component. Middleware refreshes the session.
          }
        },
      },
    },
  );
}
