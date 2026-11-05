import { formatDate, formatClock } from "@/lib/dates";

/**
 * Turning what the audit table stores into what a person reads.
 *
 * The log is written by the database for the database: an action is a dotted
 * code, an entity is the table the row lives in, and the detail is the raw
 * JSON payload with its column names and its foreign keys. All four were being
 * printed to the screen as stored, so the audit page — the one screen whose
 * whole job is to be read by a human after something has gone wrong — showed
 * "appointment.cancel.public", "appointments", a UUID, and
 * {"reason":null,"on_date":"2026-08-25","doctor_id":"38367450-..."}.
 *
 * Nothing is dropped from the record itself. This only changes how it is
 * shown.
 */

const ACTIONS: Record<string, string> = {
  "appointment.book.public": "Appointment booked online",
  "appointment.book.reception": "Appointment booked at the counter",
  "appointment.cancel.public": "Appointment cancelled by the patient",
  "appointment.cancel.reception": "Appointment cancelled by reception",
  "appointment.status": "Appointment status changed",
  "appointment.cancel": "Appointment cancelled",
  "appointment.edit": "Appointment details corrected",
  /* Written alongside the booking itself when reception books past a rule the
     public flow enforces. Named as what it is, so an audit reads "the desk
     booked this after same-day booking had closed" rather than as a code. */
  "appointment.book.cutoff_override": "Booked after same-day booking had closed",
  "appointment.book.limit_override": "Booked past the limit for this mobile number",
  "staff.create": "Staff account created",
  "staff.reset_password": "Password reset",
  "staff.set_active": "Account enabled or disabled",
  "staff.set_role": "Role changed",
  "settings.update": "Site setting changed",
  "doctor.create": "Doctor added",
  "doctor.update": "Doctor updated",
  "schedule.update": "Clinic schedule changed",
  "schedule.deactivate": "Clinic session withdrawn",
  "schedule.exception": "Clinic change recorded",
  "exception.save": "Clinic change saved",
  "exception.approve": "Leave or clinic change approved",
  "exception.delete": "Clinic change removed",
  "holiday.add": "Hospital holiday added",
  "holiday.remove": "Hospital holiday removed",
  "announcement.create": "Announcement published",
  "announcement.update": "Announcement updated",
  "data.purge": "Old contact details removed",
};

const ENTITIES: Record<string, string> = {
  appointments: "Appointment",
  staff_profiles: "Staff account",
  site_settings: "Site setting",
  doctors: "Doctor",
  doctor_schedules: "Clinic schedule",
  schedule_exceptions: "Clinic change",
  announcements: "Announcement",
  services: "Service",
  departments: "Department",
};

/** Fields that are only useful to the database. */
const HIDDEN = new Set([
  "doctor_id",
  "department_id",
  "staff_id",
  "appointment_id",
  "schedule_id",
  "id",
  "user_id",
  "actor_id",
]);

const FIELDS: Record<string, string> = {
  on_date: "Date",
  token_no: "Token",
  start_time: "From",
  end_time: "To",
  patient_name: "Patient",
  patient_phone: "Mobile",
  booking_ref: "Reference",
  reason: "Reason",
  role: "Role",
  email: "User id",
  by: "By",
  status: "Status",
  weekday: "Day",
  max_patients: "Tokens",
  is_active: "Active",
  key: "Setting",
  value: "New value",
  booked_at: "Booked at",
  cutoff_was: "Booking had closed at",
  is_overflow: "Extra token",
  booked_over_phone: "Booked by telephone",
  patient_type: "Patient type",
  cancelled_by: "Cancelled by",
};

const ROLES: Record<string, string> = {
  tech: "Technical support",
  reception: "Reception",
  doctor: "Doctor",
};

/** "appointment.book.public" -> "Appointment booked online". */
export function actionLabel(action: string): string {
  if (ACTIONS[action]) return ACTIONS[action];
  /* An action this file has not been taught yet is still not shown as a
     dotted code: the dots become spaces and the first letter is raised, so a
     new one reads as words until somebody adds it above. */
  const words = action.replace(/[._]/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** "appointments" -> "Appointment". Never the table name. */
export function entityLabel(entity: string): string {
  if (ENTITIES[entity]) return ENTITIES[entity];
  const words = entity.replace(/[._]/g, " ").replace(/s$/, "").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function roleLabel(role: string | null): string {
  if (!role) return "";
  return ROLES[role] ?? role;
}

/**
 * The JSON payload as a readable line.
 *
 * Foreign keys and row ids are dropped rather than printed — they identify a
 * row to the database and mean nothing to a reader. Nulls and empty strings
 * are dropped too: "Reason: null" is worse than the field simply not being
 * there.
 */
export function detailLine(meta: unknown): string {
  if (!meta || typeof meta !== "object") return "";

  const parts: string[] = [];
  for (const [key, raw] of Object.entries(meta as Record<string, unknown>)) {
    if (HIDDEN.has(key)) continue;
    if (raw === null || raw === undefined || raw === "") continue;
    /* A false flag is not news. Printing "Extra token: No" and "Booked by
       telephone: No" on every ordinary booking buried the two fields that
       actually differ between rows. A flag appears only when it is set. */
    if (raw === false) continue;

    let value = String(raw);
    if (key === "on_date") value = formatDate(value);
    /* Any value that looks like a clock is put through the same formatter,
       not just the two columns named start_time and end_time. The override
       row carries booked_at as "22:47:02.757017", and six decimal places of a
       second is the database talking to itself. */
    else if (/^\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(value)) {
      value = formatClock(value.slice(0, 8));
    } else if (key === "role") value = roleLabel(value);
    else if (raw === true) value = "Yes";

    parts.push(`${FIELDS[key] ?? humanField(key)}: ${value}`);
  }
  return parts.join(" · ");
}

function humanField(key: string): string {
  const words = key.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
