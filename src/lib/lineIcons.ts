/**
 * The illustrated line icons in /public/icons/line: navy outline, one part in
 * the highlight green (red on the emergency icon only). Generated for this
 * site and cropped to 192px squares with transparent backgrounds.
 *
 * A department or service with no drawn icon yet returns null, and the caller
 * falls back to its SVG mark.
 */
const DEPARTMENT_ICONS: { match: RegExp; file: string }[] = [
  { match: /general medicine|internal medicine/i, file: "general-medicine" },
  { match: /paediatric|pediatric/i, file: "paediatrics" },
  { match: /ophthalm|eye/i, file: "ophthalmology" },
  { match: /gyn|obstet/i, file: "gynaecology-obstetrics" },
  { match: /psychiatr/i, file: "psychiatry" },
  { match: /dental|oral surgery/i, file: "dental-oral-surgery" },
  { match: /facio|maxillo|maxillary/i, file: "facio-maxillary-surgery" },
  { match: /biochem/i, file: "biochemistry" },
  { match: /patholog/i, file: "pathology" },
  { match: /cardio/i, file: "cardiology" },
  { match: /radiolog/i, file: "radiology" },
];

const SERVICE_ICONS: { match: RegExp; file: string }[] = [
  { match: /outdoor patient|\bopd\b/i, file: "opd" },
  { match: /indoor patient|in-patient/i, file: "inpatient" },
  { match: /laborator/i, file: "laboratory" },
  { match: /neuro/i, file: "neurophysiology" },
  { match: /ultrasono/i, file: "ultrasound" },
  { match: /radiolog/i, file: "radiology" },
  { match: /cardio/i, file: "cardiology" },
];

const path = (file: string) => `/icons/line/${file}.png`;

export function departmentIcon(name: string): string | null {
  const hit = DEPARTMENT_ICONS.find((entry) => entry.match.test(name));
  return hit ? path(hit.file) : null;
}

export function serviceIcon(name: string): string | null {
  const hit = SERVICE_ICONS.find((entry) => entry.match.test(name));
  return hit ? path(hit.file) : null;
}

export const TASK_ICONS = {
  book: path("book-opd"),
  findDoctor: path("find-doctor"),
  checkBooking: path("check-booking"),
  emergency: path("emergency"),
  directions: path("directions"),
} as const;
