import { cache } from "react";
import { todayIST } from "@/lib/dates";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Today's booking count, read once per request.
 *
 * Both the top strip (in the public layout) and the fact rail (on the home
 * page) show this figure, and a layout cannot hand data down to the page
 * beneath it. Wrapping the call in React's `cache` means the two callers
 * share a single query per render pass rather than each issuing their own,
 * and — more importantly — they cannot disagree with each other by reading
 * the table at two different moments.
 *
 * `anon` has no privileges on the appointments table, so this goes through an
 * aggregate function that returns a count and nothing else.
 */
export const opdCountToday = cache(async (): Promise<number> => {
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("opd_count", { p_on_date: todayIST() });
  return typeof data === "number" ? data : 0;
});
