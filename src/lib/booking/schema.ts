import { z } from "zod";

export const PATIENT_TYPES = [
  "Student",
  "Staff",
  "Faculty",
  "Dependent",
  "Other",
] as const;

export const PATIENT_SEXES = ["Male", "Female", "Other"] as const;

/** Patient types for which a roll number or employee number is required. */
export const ID_REQUIRED_TYPES: readonly string[] = ["Student", "Staff", "Faculty"];

/**
 * The patient fields, shared by the public form and the counter form. Both
 * forms collect exactly the same information about the patient; only the
 * surrounding controls differ.
 */
const patientFields = z.object({
  doctorId: z.string().uuid("Choose a doctor."),
  onDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  patientName: z
    .string()
    .trim()
    .min(2, "Enter the patient name.")
    .max(120, "The name is too long. Use 120 characters or fewer."),
  patientAge: z.coerce
    .number()
    .int("Enter the age in whole years.")
    .min(0, "Enter the age in whole years.")
    .max(120, "Enter an age of 120 or below."),
  patientSex: z.enum(PATIENT_SEXES, "Choose the patient sex."),
  patientPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number."),
  patientType: z.enum(PATIENT_TYPES, "Choose the patient type."),
  patientIdNo: z.string().trim().max(40).optional().or(z.literal("")),
  reason: z
    .string()
    .trim()
    .max(200, "Keep the reason to 200 characters or fewer.")
    .optional()
    .or(z.literal("")),
});

type PatientFields = z.infer<typeof patientFields>;

/** Mirrors the `patient_id_required` check constraint on the table. */
function idNumberSupplied(value: PatientFields): boolean {
  return (
    !ID_REQUIRED_TYPES.includes(value.patientType) ||
    (value.patientIdNo ?? "").trim().length > 0
  );
}

const ID_ISSUE = {
  path: ["patientIdNo"],
  message: "Enter the roll number or employee number for this patient type.",
};

export const bookingSchema = patientFields
  .extend({
    consent: z.literal(true, "Tick the box to confirm you agree."),
    // Honeypot. A real patient never sees this field, so anything in it is a bot.
    website: z.string().max(0).optional().or(z.literal("")),
  })
  .refine(idNumberSupplied, ID_ISSUE);

export type BookingInput = z.infer<typeof bookingSchema>;

/**
 * The counter form. Same patient rules. The operator additionally controls the
 * override flags, which Postgres honours only when auth_role() is reception or
 * tech -- a caller holding the publishable key may send them and they are
 * forced back to false.
 */
export const receptionBookingSchema = patientFields
  .extend({
    consent: z.boolean().optional(),
    website: z.string().optional().or(z.literal("")),
    bookedOverPhone: z.boolean().optional(),
    overrideCutoff: z.boolean().optional(),
    overridePhoneLimit: z.boolean().optional(),
    overflow: z.boolean().optional(),
    overrideReason: z.string().trim().max(200).optional().or(z.literal("")),
  })
  .refine(idNumberSupplied, ID_ISSUE);

export type ReceptionBookingInput = z.infer<typeof receptionBookingSchema>;

export const lookupSchema = z.object({
  bookingRef: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^SPM-[A-HJ-NP-Z2-9]{6}$/, "A reference looks like SPM-7F3K9Q."),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter the 10-digit mobile number used for the booking."),
});

export const cancelSchema = lookupSchema.extend({
  reason: z.string().trim().max(200).optional().or(z.literal("")),
});
