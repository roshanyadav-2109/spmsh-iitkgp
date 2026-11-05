/**
 * The facilities the hospital itself lists, and the photograph shown for each.
 *
 * Nothing is added here from what hospitals generally have — a bed count, a
 * theatre or an ICU this hospital has not published would be a claim, and on a
 * hospital page a wrong claim sends someone to the wrong building.
 *
 * Every photograph is public domain. That is not an aesthetic choice: CC BY and
 * CC BY-SA oblige a visible credit beside the image, and this page carries no
 * credit block, so anything under those licences cannot appear here. Swapping
 * one of these for a CC-licensed picture means putting the credit back.
 */
export type Facility = {
  name: string;
  image: string;
  alt: string;
};

export const FACILITIES: Facility[] = [
  {
    name: "Department",
    image: "/images/facility/lab4.jpg",
    alt: "The booking counter at this hospital",
  },
  {
    name: "Laboratory investigations",
    image: "/images/facility/laboratory.jpg",
    alt: "Technicians working at benches in a hospital laboratory",
  },
  {
    name: "Neuro-physiological investigations",
    image: "/images/facility/neurophysiology.jpg",
    alt: "A neurological examination being carried out at a hospital",
  },
  {
    name: "Ultrasonographical investigations",
    image: "/images/facility/ultrasound.jpg",
    alt: "A radiographer operating imaging equipment",
  },
  {
    name: "Radiological investigations",
    image: "/images/facility/radiology.jpg",
    alt: "A hospital angiography suite with a ceiling-mounted imaging arm and display wall",
  },
  {
    name: "Cardiological investigations",
    image: "/images/facility/cardiology.jpg",
    alt: "A cardiac catheterisation laboratory during a procedure",
  },
  {
    // Not "under development" any longer. In-patient services began and the
    // first operation was carried out in 2025, and the hospital is expanding
    // to 220 in-patient beds. Saying otherwise would send someone who needs
    // admission somewhere else.
    name: "In-patient department",
    image: "/images/facility/ward.jpg",
    alt: "A single-bed hospital room in a surgical unit",
  },
];

export const isOpdService = (slug: string, name: string) =>
  slug === "outdoor-patient-department" || /outdoor patient|\bopd\b/i.test(name);

/** Photo for a service: matched by name; the OPD gets the booking-counter photo. */
export function photoForService(slug: string, name: string): Facility | undefined {
  if (isOpdService(slug, name)) return FACILITIES.find((f) => f.name === "Department");
  if (/indoor patient|in-patient/i.test(name)) {
    return FACILITIES.find((f) => f.name === "In-patient department");
  }
  return FACILITIES.find((f) => f.name.toLowerCase() === name.toLowerCase());
}
