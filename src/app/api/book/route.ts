import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { receptionBookingSchema } from "@/lib/booking/schema";
import { bookingMessage, parseBookingError } from "@/lib/booking/errors";
import { clientAddress, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The single booking endpoint. The public form and the reception counter both
 * post here, and both end up in the same `book_appointment` function with the
 * same lock and the same token sequence.
 *
 * The client is cookie-aware, so a signed-in operator's request reaches
 * Postgres as that operator and `auth_role()` returns 'reception'. An
 * anonymous request reaches it as `anon`. The override flags are therefore
 * decided in the database, not here.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // IP limiting applies to the public form only. A busy counter legitimately
  // books far more than this from one address.
  if (!user) {
    const address = clientAddress(request.headers);
    const burst = rateLimit(`book:burst:${address}`, 5, 60);
    const hourly = rateLimit(`book:hour:${address}`, 20, 3600);

    if (!burst.allowed || !hourly.allowed) {
      const retry = Math.max(burst.retryAfterSeconds, hourly.retryAfterSeconds);
      return NextResponse.json(
        {
          ok: false,
          code: "RATE_LIMITED",
          message:
            "Too many booking attempts from this connection. Wait a few minutes, or telephone the reception desk.",
        },
        { status: 429, headers: { "Retry-After": String(retry) } },
      );
    }
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "INVALID_REQUEST", message: "The request could not be read." },
      { status: 400 },
    );
  }

  const parsed = receptionBookingSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION",
        message: "Check the highlighted fields.",
        fieldErrors,
      },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // Honeypot: a real patient never sees this field. Answer as though the
  // booking succeeded so a script gets no signal, but write nothing.
  if (input.website && input.website.length > 0) {
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  }

  // A patient-side request must carry the consent tick. The counter form does
  // not show one, because the operator reads the line out at the desk.
  if (!user && input.consent !== true) {
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION",
        message: "Check the highlighted fields.",
        fieldErrors: { consent: "Tick the box to confirm you agree." },
      },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("book_appointment", {
    p_doctor_id: input.doctorId,
    p_on_date: input.onDate,
    p_patient_name: input.patientName,
    p_patient_age: input.patientAge,
    p_patient_sex: input.patientSex,
    p_patient_phone: input.patientPhone,
    p_patient_type: input.patientType,
    p_patient_id_no: input.patientIdNo || undefined,
    p_reason: input.reason || undefined,
    p_booked_over_phone: input.bookedOverPhone ?? false,
    p_override_cutoff: input.overrideCutoff ?? false,
    p_override_phone_limit: input.overridePhoneLimit ?? false,
    p_overflow: input.overflow ?? false,
    p_override_reason: input.overrideReason || undefined,
  });

  if (error) {
    const { code, detail } = parseBookingError(error);
    return NextResponse.json(
      {
        ok: false,
        code,
        message: bookingMessage(code, user ? "desk" : "public", detail),
        detail,
      },
      { status: code === "UNKNOWN" ? 500 : 409 },
    );
  }

  const booking = data?.[0];
  if (!booking) {
    return NextResponse.json(
      {
        ok: false,
        code: "UNKNOWN",
        message: bookingMessage("UNKNOWN", user ? "desk" : "public"),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, booking }, { status: 201 });
}
