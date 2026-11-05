import type { ReactNode } from "react";
import Image from "next/image";

/**
 * A department's icon, from the hospital's own icon sheets (navy line,
 * green fill), in public/icons/line. Decorative: the
 * department's name always sits beside it.
 */
function deptIcon(name: string, size: number): ReactNode {
  return (
    <Image
      src={`/icons/line/${name}.png`}
      alt=""
      width={size}
      height={size}
      className="shrink-0"
      unoptimized
    />
  );
}

export type Mark = {
  icon: ReactNode;
  tone: string;
  /**
   * A one-line plain-language gloss. Department names on this site are
   * Latin-only — "Ophthalmology", "Facio-Maxillary Surgery", "Biochemistry" —
   * and a patient looking for an eye doctor or a skin doctor has no way in.
   * The gloss is set under the name on every tile and every index row.
   */
  gloss: string;
  /**
   * Everyday words for the same thing. The /doctors search matches these as
   * well as names, so "eye", "skin", "chest", "child" or "teeth" lands
   * somewhere rather than returning nothing and leaving the reader unsure
   * whether the hospital has such a doctor or whether they searched badly.
   */
  synonyms: string[];
  /**
   * The department's colour as a BACKGROUND, for the "Read more" button on the
   * home grid and nothing else. It is not a tile fill: filling the nine tiles
   * turned that grid into nine saturated blocks. Kept separate from `tone` so
   * the distinction is legible at the call site.
   */
  fill: string;
  /**
   * Laboratory departments run no OPD and cannot be consulted. They are
   * grouped apart on the departments index so that a patient does not book a
   * consultation with a pathologist.
   */
  laboratory: boolean;
};

/**
 * Which mark, which colour, and which plain words go with a department.
 *
 * Shared between the home page grid, the departments index and the doctors
 * search so the three never drift: a department that is a green tooth on one
 * page must not be a blue building on the other, and a gloss written for the
 * tile must be the one the search matches.
 *
 * Matched on words in the department's name rather than on its slug or its id,
 * so a department renamed or added by the desk still finds its icon without a
 * migration. Order matters — the first hit wins, and the more specific terms
 * are tested before the general ones.
 *
 * The colours are named for the speciality rather than the hue, so the tie
 * between a department and its colour survives someone later deciding that
 * paediatrics should be green. Each clears 5:1 on white. `tone` is the mark's colour and
 * `fill` is a background for the "Read more" button alone. Filling whole tiles
 * with it turned the departments index into nine saturated blocks, so the two
 * are named apart rather than left as one value a caller can point anywhere.
 */
const ENTRIES: {
  match: RegExp;
  /** File name in public/icons/line, without the extension. */
  image: string;
  tone: string;
  fill: string;
  gloss: string;
  synonyms: string[];
  laboratory?: boolean;
}[] = [
  {
    match: /dental|oral/i,
    image: "dental-oral-surgery",
    tone: "text-dept-dental",
    fill: "bg-dept-dental",
    gloss: "teeth, gums and mouth",
    synonyms: [
      "দাঁত",
      "মাড়ি",
      "दाँत",
      "दांत",
      "मसूड़े",
      "పళ్ళు",
      "పన్ను",
      "చిగుళ్ళు",
      "teeth",
      "tooth",
      "dentist",
      "gums",
      "mouth",
      "dental",
      "daant",
      "dant",
    ],
  },
  {
    match: /facio|maxillary|plastic/i,
    image: "facio-maxillary-surgery",
    tone: "text-dept-surgery",
    fill: "bg-dept-surgery",
    gloss: "face and jaw surgery",
    synonyms: ["চোয়াল", "जबड़ा", "దవడ", "face", "jaw", "cheek", "facial", "mouth"],
  },
  {
    match: /ophthal|eye/i,
    image: "ophthalmology",
    tone: "text-dept-ophthalmology",
    fill: "bg-dept-ophthalmology",
    gloss: "eyes and sight",
    synonyms: [
      "চোখ",
      "দৃষ্টি",
      "आँख",
      "आंख",
      "नज़र",
      "కన్ను",
      "కళ్ళు",
      "చూపు",
      "eye",
      "eyes",
      "sight",
      "vision",
      "cataract",
      "spectacles",
      "aankh",
      "chokh",
    ],
  },
  {
    match: /gynae|obstet|maternity/i,
    image: "gynaecology-obstetrics",
    tone: "text-dept-obstetrics",
    fill: "bg-dept-obstetrics",
    gloss: "women's health, pregnancy and birth",
    synonyms: [
      "গর্ভ",
      "প্রসব",
      "মহিলা",
      "गर्भ",
      "प्रसव",
      "महिला",
      "గర్భం",
      "ప్రసవం",
      "మహిళ",
      "women",
      "pregnancy",
      "pregnant",
      "maternity",
      "birth",
      "period",
      "garbh",
    ],
  },
  {
    match: /paediatric|pediatric|child|neonat/i,
    image: "paediatrics",
    tone: "text-dept-paediatrics",
    fill: "bg-dept-paediatrics",
    gloss: "children and newborns",
    synonyms: [
      "শিশু",
      "বাচ্চা",
      "बच्चा",
      "बच्चे",
      "शिशु",
      "పిల్లలు",
      "శిశువు",
      "child",
      "children",
      "baby",
      "infant",
      "newborn",
      "kids",
      "baccha",
      "shishu",
    ],
  },
  {
    match: /psychiatr|mental|psycho/i,
    image: "psychiatry",
    tone: "text-dept-psychiatry",
    fill: "bg-dept-psychiatry",
    gloss: "mental health",
    synonyms: [
      "মানসিক",
      "मानसिक",
      "మానసిక",
      "mental",
      "mind",
      "depression",
      "anxiety",
      "sleep",
      "stress",
    ],
  },
  {
    match: /biochem/i,
    image: "biochemistry",
    tone: "text-dept-biochemistry",
    fill: "bg-dept-biochemistry",
    gloss: "laboratory tests on blood and body fluids",
    synonyms: ["blood test", "laboratory", "lab", "sample", "report"],
    laboratory: true,
  },
  {
    match: /patholog|microbiolog|haematolog|hematolog/i,
    image: "pathology",
    tone: "text-dept-pathology",
    fill: "bg-dept-pathology",
    gloss: "laboratory study of disease and samples",
    synonyms: ["laboratory", "lab", "biopsy", "sample", "report", "test"],
    laboratory: true,
  },
];

const FALLBACK = {
  tone: "text-dept-medicine",
  fill: "bg-dept-medicine",
  gloss: "general adult illness",
  // Everyday and transliterated Hindi/Bengali words too ("bukhar", "jor"), so
  // the commonest complaints reach a physician instead of an empty result.
  synonyms: [
    "জ্বর",
    "কাশি",
    "বুখার",
    "बुखार",
    "खांसी",
    "जुकाम",
    "జ్వరం",
    "దగ్గు",
    "fever",
    "chest",
    "breathing",
    "diabetes",
    "blood pressure",
    "stomach",
    "headache",
    "cough",
    "cold",
    "body pain",
    "weakness",
    "vomiting",
    "loose motion",
    "sugar",
    "bp",
    "bukhar",
    "jwar",
  ],
};

export function markFor(name: string, size = 56): Mark {
  const hit = ENTRIES.find((entry) => entry.match.test(name));
  if (!hit) {
    return {
      icon: deptIcon("general-medicine", size),
      tone: FALLBACK.tone,
      fill: FALLBACK.fill,
      gloss: FALLBACK.gloss,
      synonyms: FALLBACK.synonyms,
      laboratory: false,
    };
  }
  return {
    icon: deptIcon(hit.image, size),
    tone: hit.tone,
    fill: hit.fill,
    gloss: hit.gloss,
    synonyms: hit.synonyms,
    laboratory: hit.laboratory ?? false,
  };
}

/**
 * Does this department answer to what the reader typed?
 *
 * The /doctors search used to match `full_name` alone, so somebody typing
 * "eye" got nothing at all — not "no eye doctor", just nothing, which reads as
 * a failed search rather than as an answer.
 */
export function departmentMatches(name: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  if (name.toLowerCase().includes(q)) return true;
  const mark = markFor(name);
  if (mark.gloss.toLowerCase().includes(q)) return true;
  return mark.synonyms.some((word) => word.includes(q) || q.includes(word));
}
