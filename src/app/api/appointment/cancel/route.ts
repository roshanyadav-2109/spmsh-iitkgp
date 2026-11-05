import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { cancelSchema } from "@/lib/booking/schema";
import { bookingMessage, parseBookingError } from "@/lib/booking/errors";
import { clientAddress, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Online cancellation by patients is switched off for now: a booking
 * reference and a mobile number alone are not enough to prove who is asking.
 * Reception cancels from the portal. Set to true to bring it back once a
 * one-time SMS code (or similar) guards it.
 */
const PUBLIC_CANCEL_ENABLED = false;

export async function POST(request: Request) {
  if (!PUBLIC_CANCEL_ENABLED) {
    return NextResponse.json(
      {
        ok: false,
        message: "Bookings cannot be cancelled online. Telephone the OPD counter.",
      },
      { status: 403 },
    );
  }
  const address = clientAddress(request.headers);
  const limit = rateLimit(`cancel:${address}`, 10, 300);

  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Telephone the reception desk." },
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

  const parsed = cancelSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Check the reference and phone number." },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("cancel_public_appointment", {
    p_ref: parsed.data.bookingRef,
    p_phone: parsed.data.phone,
    p_reason: parsed.data.reason || undefined,
  });

  if (error) {
    // Only ever return our own mapped sentence. `detail` is whatever Postgres
    // raised, and for an unrecognised error that is an internal message —
    // constraint names, function names — shown to an anonymous caller.
    const { code } = parseBookingError(error);
    return NextResponse.json(
      { ok: false, code, message: bookingMessage(code) },
      { status: code === "UNKNOWN" ? 500 : 409 },
    );
  }

  return NextResponse.json({ ok: true });
}
