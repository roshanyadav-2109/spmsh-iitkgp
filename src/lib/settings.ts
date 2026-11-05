import { createPublicClient } from "@/lib/supabase/public";

/**
 * Editable site content. Values the hospital has not supplied yet hold a
 * PROVIDE token, which `SettingValue` renders as a boxed placeholder rather
 * than as if it were real content.
 */
export type Settings = Record<string, string>;

/**
 * Public content supplied by the hospital's published contact and services
 * pages, plus safe guidance for details those pages do not publish. These
 * defaults keep the public site useful if Supabase is temporarily unavailable
 * or still contains an untouched PROVIDE token.
 */
const PUBLIC_DEFAULTS: Settings = {
  hospital_address:
    "Registered Office: Balarampur, IIT Kharagpur Campus, Dist. Paschim Medinipur, West Bengal 721301",
  reception_phone: "03222-215306",
  front_desk_phone: "03222-215010",
  office_phone: "03222-215014",
  /* One line for the header, hero and footer. opd_timings_text is the long form. */
  opd_hours_short: "9 AM–12 PM · 2–5 PM",
  opd_timings_text:
    "Forenoon 09:00-12:00. Afternoon 14:00-17:00. Individual doctors sit on set days; see each doctor profile.",
  emergency_phone: "112",
  ambulance_phone: "108",
  hospital_email:
    "No public email is listed. Please telephone the OPD counter at 03222-215306.",
  emergency_location_text:
    "For an emergency, call 112 or come directly to Dr. Syama Prasad Mookerjee Superspeciality Hospital at Balarampur, IIT Kharagpur Campus.",
  pharmacy_timings_text:
    "No published timings. Please confirm availability at the OPD counter: 03222-215306.",
  laboratory_timings_text:
    "No published timings. Please confirm sample collection at the OPD counter: 03222-215306.",
  /* The two photographs on the check-a-booking page. Held as settings rather
     than written into the component so the desk can change them without a
     deploy — the settings screen lists every row in site_settings, so these
     appear there automatically. The values below are the fallback if a row is
     missing or has been blanked. */
  lookup_image_1: "/images/facility/inauguration-tour.jpg",
  lookup_image_1_alt: "Visitors in a corridor of the hospital",
  lookup_image_2: "/images/hospital-building.jpg",
  lookup_image_2_alt: "The hospital building at Balarampur on the IIT Kharagpur campus",
  map_embed_url:
    "https://www.google.com/maps/search/?api=1&query=Dr+Syama+Prasad+Mookerjee+Superspeciality+Hospital%2C+Balarampur%2C+IIT+Kharagpur+Campus%2C+West+Bengal+721301",
};

export async function getSettings(): Promise<Settings> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("site_settings").select("key, value");

  const settings: Settings = { ...PUBLIC_DEFAULTS };
  for (const row of data ?? []) {
    if (!isPlaceholder(row.value)) settings[row.key] = row.value;
  }
  return settings;
}

/** True when the stored value is still an unfilled PROVIDE token. */
export function isPlaceholder(value: string | undefined): boolean {
  return !value || value.trim().startsWith("[[PROVIDE:");
}

/** The description inside `[[PROVIDE: ...]]`, for rendering. */
export function placeholderNote(value: string | undefined): string {
  const match = /^\[\[PROVIDE:\s*(.*?)\s*\]\]$/.exec((value ?? "").trim());
  return match?.[1] ?? "value not supplied";
}
