import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { lookupSchema } from "@/lib/booking/schema";
import { clientAddress, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Booking lookup. The database already answers identically for a wrong
 * reference and a wrong phone number; this adds a per-address limit so the
 * pair cannot be brute-forced at speed.
 */
export async function POST(request: Request) {
  const address = clientAddress(request.headers);
  const limit = rateLimit(`lookup:${address}`, 10, 300);

  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Too many attempts. Wait a few minutes, or telephone the reception desk.",
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "The request could not be read." },
      { status: 400 },
    );
  }

  const parsed = lookupSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return NextResponse.json(
      { ok: false, message: "Check the highlighted fields.", fieldErrors },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("lookup_appointment", {
    p_ref: parsed.data.bookingRef,
    p_phone: parsed.data.phone,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: "The booking could not be looked up. Try again." },
      { status: 500 },
    );
  }

  const appointment = data?.[0];
  if (!appointment) {
    // The same sentence for a wrong reference and a wrong number.
    return NextResponse.json(
      { ok: false, message: "No booking matches that reference and phone number." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, appointment });
}
