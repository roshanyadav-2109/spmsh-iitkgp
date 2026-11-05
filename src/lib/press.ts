/**
 * Press coverage of the hospital, newest first, from established news
 * organisations only. Every entry was opened and checked against the
 * publisher's page: the headline exactly as published, the publisher's own
 * date, and a working link. The card shows the publisher's own link preview
 * (see lib/linkPreview.ts); the headline here is the fallback when that page
 * cannot be read. Add an article only after the same check; never paraphrase
 * a headline or guess a date.
 */
export type PressItem = {
  outlet: string;
  headline: string;
  /** ISO date as printed by the publisher. */
  date: string;
  href: string;
  /** Wire agency, when the publisher credits one. */
  via?: string;
};

/**
 * Each paper's own logo, taken from its own website (the publisher logo its
 * pages declare, or its header logo), trimmed of blank edges only.
 * Files in public/images/press. Width and height are the file's.
 */
export const OUTLET_LOGOS: Record<
  string,
  { src: string; width: number; height: number }
> = {
  ThePrint: { src: "/images/press/theprint.png", width: 800, height: 149 },
  Dinamalar: { src: "/images/press/dinamalar.png", width: 211, height: 50 },
  "ETV Bharat": { src: "/images/press/etvbharat.png", width: 142, height: 140 },
  "India TV": { src: "/images/press/indiatv.png", width: 207, height: 56 },
  "Business Today": { src: "/images/press/businesstoday.png", width: 524, height: 59 },
  "Millennium Post": {
    src: "/images/press/millenniumpost.png",
    width: 627,
    height: 91,
  },
};

export const PRESS: PressItem[] = [
  {
    outlet: "Dinamalar",
    headline:
      "First surgery conducted successfully at IIT-KGP's new super speciality hospital",
    date: "2025-09-29",
    href: "https://www.dinamalar.com/news/kalvimalar-news-en/first-surgery-conducted-successfully-at-iit-kgp39s-new-super-speciality-hospital/57461",
  },
  {
    outlet: "ThePrint",
    headline:
      "First surgery conducted successfully at IIT-KGP's new super speciality hospital",
    date: "2025-09-28",
    href: "https://theprint.in/india/first-surgery-conducted-successfully-at-iit-kgps-new-super-speciality-hospital/2753031",
    via: "PTI",
  },
  {
    outlet: "ETV Bharat",
    headline:
      "PM Modi to inaugurate Dr Syama Prasad Mookerjee Institute at IIT Kharagpur",
    date: "2021-02-23",
    href: "https://www.etvbharat.com/english/bharat/pm-modi-to-inaugurate-dr-syama-prasad-mookerjee-institute-at-iit-kharagpur/na20210223053050003",
  },
  {
    outlet: "India TV",
    headline: "PM Modi addresses 66th Convocation of IIT Kharagpur",
    date: "2021-02-23",
    href: "https://www.indiatvnews.com/news/india/pm-modi-iit-kharagpur-super-specialty-hospital-inauguration-live-updates-686684",
  },
  {
    outlet: "Business Today",
    headline:
      "PM Modi to inaugurate Dr Syama Prasad Mookerjee research institute at IIT Kharagpur on Feb 23",
    date: "2021-02-22",
    href: "https://www.businesstoday.in/current/economy-politics/pm-modi-to-inaugurate-dr-syama-prasad-mookerjee-research-institute-at-iit-kharagpur-on-feb-23/story/431932.html",
    via: "PTI",
  },
  {
    outlet: "Millennium Post",
    headline: "IIT Kharagpur superspecialty hospital to start OPD by year-end",
    date: "2019-10-21",
    href: "https://www.millenniumpost.in/kolkata/iit-kharagpur-superspecialty-hospital-to-start-opd-by-year-end-380724",
  },
];

/** The publications, once each, in order of their latest article. */
export const PRESS_OUTLETS = [...new Set(PRESS.map((item) => item.outlet))];

/**
 * Posts from official accounts, embedded as the network renders them.
 * Only posts by IIT Kharagpur or its office-holders, each opened and checked.
 * X: the post URL. LinkedIn: the post's urn:li:activity id.
 */
export type SocialPost =
  | { platform: "x"; url: string; author: string }
  | { platform: "linkedin"; urn: string; author: string };

export const SOCIAL_POSTS: SocialPost[] = [
  {
    platform: "linkedin",
    urn: "urn:li:activity:7377751503576526848",
    author: "Prof. Suman Chakraborty",
  },
  {
    platform: "x",
    url: "https://x.com/IITKgp/status/1946097738002956684",
    author: "IIT Kharagpur",
  },
];
