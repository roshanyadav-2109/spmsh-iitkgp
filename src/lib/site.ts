/**
 * Site identity and navigation. The hospital and institute names are the only
 * two facts hard-coded anywhere in the codebase; everything else that varies
 * (numbers, timings, address) is either in `site_settings` or marked with a
 * PROVIDE token.
 */

/**
 * The name is spelled as it appears on the building and on spmsh.iitkgp.ac.in:
 * "Syama Prasad Mookerjee", not "Shyama Prasad Mukherjee". The hospital is a
 * superspeciality hospital, and the full name says so.
 */
export const SITE = {
  name: "Dr. Syama Prasad Mookerjee Superspeciality Hospital",
  /** As set on the hospital's own lockup. */
  nameHindi: "ड. श्यामा प्रसाद मुखर्जी सुपरस्पेशलिटी अस्पताल",
  shortName: "SPMSH",
  institute: "Indian Institute of Technology Kharagpur",
  /** The legal entity, per the hospital's own contact page. */
  operator:
    "Established as a Section 8 Company under the aegis of Dr. Syama Prasad Mookerjee Institute of Medical Sciences & Research Forum",
  timezone: "Asia/Kolkata",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export type NavItem = {
  href: string;
  label: string;
  /** Match the path exactly rather than by prefix. Needed for "/". */
  exact?: boolean;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home", exact: true },
  { href: "/departments", label: "Departments" },
  { href: "/doctors", label: "Doctors" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact and timings" },
  { href: "/emergency", label: "Emergency" },
];

/** Footer: what patients come to do. */
export const IMPORTANT_LINKS: NavItem[] = [
  { href: "/book", label: "Book OPD appointment" },
  { href: "/appointment/status", label: "Check a booking" },
  { href: "/doctors", label: "Find a doctor" },
  { href: "/departments", label: "Departments" },
  { href: "/emergency", label: "Emergency" },
];

/** Footer: the rest of the site. */
export const USEFUL_LINKS: NavItem[] = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/announcements", label: "Notices" },
  { href: "/newsroom", label: "Newsroom" },
  { href: "/administration", label: "Administration" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Staff login" },
];

export const LEGAL_LINKS: NavItem[] = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/privacy-practices", label: "Privacy practices" },
  { href: "/nondiscrimination", label: "Nondiscrimination" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/advertising-policy", label: "Advertising policy" },
  { href: "/site-map", label: "Site map" },
  { href: "/cookies", label: "Cookies" },
];

/**
 * The hospital's published figures, from its own About page. 250 is the
 * sanctioned total (March 2022), not the in-patient capacity; never print it
 * without that qualifier.
 */
export const HOSPITAL_FIGURES = {
  beds: "250",
  mdSeats: "20",
  freeBeds: "1 in 10",
} as const;

/**
 * The hospital's milestones, shared by the About page and the home page.
 * Sources: spmsh.iitkgp.ac.in/about.php; IIT Kharagpur on X (6 July 2024,
 * radiology and imaging department); PTI via ThePrint, 28 September 2025
 * (first surgery); Careers360, 6 October 2025 (MD programme).
 */
export const HOSPITAL_MILESTONES = [
  {
    year: "2021",
    detail: "Institute of medical sciences renamed and inaugurated, 23 February",
  },
  {
    year: "2022",
    detail: "Beds inaugurated, 13 March; ICU beds donated by alumnus Arjun Malhotra",
  },
  {
    year: "2024",
    detail:
      "Radiology and imaging department opened, 6 July, on Dr. Mookerjee's 124th birth anniversary",
  },
  {
    year: "2025",
    detail:
      "First surgery, September (day-care, led by Dr. R. K. Behera); in-patient services begin",
  },
  {
    year: "Next",
    detail: "In-patient expansion and the first MD programme",
  },
] as const;
