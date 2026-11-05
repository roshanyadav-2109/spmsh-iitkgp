/**
 * Booking error codes raised by `book_appointment` and friends, mapped to
 * sentences a person can act on.
 *
 * Two audiences, two wordings. A patient is told what to do next; an operator
 * is told the number and given the lever that exists at the counter.
 */

export type BookingErrorCode =
  | "SLOT_FULL"
  | "DOCTOR_UNAVAILABLE"
  | "DATE_CLOSED"
  | "PAST_CUTOFF"
  | "DUPLICATE_BOOKING"
  | "RATE_LIMITED"
  | "OVERFLOW_DISABLED"
  | "OVERFLOW_REASON_REQUIRED"
  | "INVALID_PHONE"
  | "INVALID_NAME"
  | "NOT_FOUND"
  | "ALREADY_CANCELLED"
  | "CANNOT_CANCEL"
  | "UNKNOWN";

const PUBLIC_MESSAGES: Record<BookingErrorCode, string> = {
  SLOT_FULL: "This session is full. Choose another date or another doctor.",
  DOCTOR_UNAVAILABLE: "This doctor is not holding an OPD on that date.",
  DATE_CLOSED: "Booking is not open for that date.",
  PAST_CUTOFF:
    "Booking for today has closed. Choose a later date, or come to the reception desk.",
  DUPLICATE_BOOKING:
    "This phone number already has an appointment with this doctor on that date.",
  RATE_LIMITED:
    "This phone number has reached the booking limit. Telephone the reception desk if you need another appointment.",
  OVERFLOW_DISABLED: "This session is full. Choose another date or another doctor.",
  OVERFLOW_REASON_REQUIRED:
    "This session is full. Choose another date or another doctor.",
  INVALID_PHONE: "Enter a 10-digit Indian mobile number.",
  INVALID_NAME: "Enter the patient name.",
  NOT_FOUND: "No booking matches that reference and phone number.",
  ALREADY_CANCELLED: "This booking is already cancelled.",
  CANNOT_CANCEL: "This appointment is closed and cannot be cancelled.",
  UNKNOWN:
    "The booking could not be completed. Try again, or telephone the reception desk.",
};

const DESK_MESSAGES: Partial<Record<BookingErrorCode, string>> = {
  SLOT_FULL: "Session full. Choose another date, or book as overflow.",
  DOCTOR_UNAVAILABLE: "Doctor not sitting on that date.",
  PAST_CUTOFF: "Past the same-day cutoff. Tick the override to record it anyway.",
  DUPLICATE_BOOKING:
    "This number already has an appointment with this doctor on this date. Use Book anyway with a reason.",
  RATE_LIMITED:
    "This number has reached its limit for the date. Use Book anyway with a reason.",
  OVERFLOW_DISABLED: "Overflow booking is switched off in site settings.",
  OVERFLOW_REASON_REQUIRED: "Type a reason for the overflow booking.",
};

/**
 * The DB raises the code as the exception message and the human sentence as
 * DETAIL. PostgREST surfaces those as `message` and `details`.
 */
export function parseBookingError(error: unknown): {
  code: BookingErrorCode;
  detail?: string;
} {
  const raw =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : "";
  const detail =
    typeof error === "object" && error !== null && "details" in error
      ? String((error as { details: unknown }).details ?? "")
      : undefined;

  const known = Object.keys(PUBLIC_MESSAGES) as BookingErrorCode[];
  const code = known.find((candidate) => raw.includes(candidate)) ?? "UNKNOWN";
  return { code, detail: detail || undefined };
}

export function bookingMessage(
  code: BookingErrorCode,
  audience: "public" | "desk" = "public",
  detail?: string,
): string {
  if (audience === "desk") {
    // The DB detail carries the live numbers ("Session full - 40 of 40"), which
    // is exactly what the operator needs, so it wins when present.
    if (detail && (code === "SLOT_FULL" || code === "DOCTOR_UNAVAILABLE")) {
      const lever = DESK_MESSAGES[code]?.split(". ").slice(1).join(". ");
      return lever ? `${detail} ${lever}` : detail;
    }
    return DESK_MESSAGES[code] ?? PUBLIC_MESSAGES[code];
  }
  return PUBLIC_MESSAGES[code];
}
