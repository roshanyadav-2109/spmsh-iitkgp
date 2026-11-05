import "server-only";

/**
 * Per-IP sliding window, held in process memory.
 *
 * This is a v1 measure and it has a real limitation: on a platform that runs
 * more than one instance, each instance keeps its own counter, so the
 * effective limit is the configured limit multiplied by the instance count.
 * It raises the cost of casual abuse; it is not a defence against a
 * distributed attempt.
 *
 * The per-phone limits that actually protect capacity are enforced inside
 * `book_appointment` in Postgres, where they are exact and shared across every
 * instance. This is the outer, cheaper layer.
 *
 * If the site is ever put behind more than one instance and this matters,
 * replace it with a Postgres table or Upstash Redis. Documented in the README.
 */

type Window = { count: number; resetAt: number };

const WINDOWS = new Map<string, Window>();
const MAX_KEYS = 5000;

function sweep(now: number) {
  if (WINDOWS.size < MAX_KEYS) return;
  for (const [key, window] of WINDOWS) {
    if (window.resetAt <= now) WINDOWS.delete(key);
  }
  // Still oversized: drop the oldest entries rather than grow without bound.
  if (WINDOWS.size >= MAX_KEYS) {
    const excess = WINDOWS.size - MAX_KEYS + 1;
    let removed = 0;
    for (const key of WINDOWS.keys()) {
      WINDOWS.delete(key);
      if (++removed >= excess) break;
    }
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = WINDOWS.get(key);
  if (!existing || existing.resetAt <= now) {
    WINDOWS.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/**
 * Best-effort client address. On Vercel `x-forwarded-for` is set by the proxy
 * and its left-most entry is the client. Behind any other proxy this header is
 * spoofable, so it is a heuristic, not an identity.
 */
export function clientAddress(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "unknown";
}
