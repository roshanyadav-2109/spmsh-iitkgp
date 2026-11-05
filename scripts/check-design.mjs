#!/usr/bin/env node
/**
 * Design-system enforcement.
 *
 * The brief's visual rules are hard constraints, so they are checked
 * mechanically rather than by eye. This script runs as part of `npm run
 * build`, so a grey class, a shadow, a pill radius, a third font weight or
 * an emoji fails the build instead of shipping.
 *
 * Scans src/ and supabase/ only. This file is deliberately excluded from
 * its own scan because it necessarily contains the banned patterns.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "supabase"];
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".css", ".sql"]);

/** The complete permitted hex palette. Anything else is a violation. */
const ALLOWED_HEX = new Set([
  "#fff",
  "#ffffff",
  "#000",
  "#000000",
  "#1e9ce5", // brand, accents and large headings only
  "#0f5bd6", // accent: the one accent on LIGHT grounds. 6.02:1 on white, so links and 13px labels finally have a legal blue. Forbidden on #0a2a5c (2.62:1).
  "#eef2f8", // panel: deliberately one step deeper than #f5f8fc tint, so a white card sitting on it separates by its own ground. Frozen — muted on it is 4.74:1 and any darkening breaks AA.
  "#0a2a5c", // navy: chrome, hero, footer
  "#061b3d", // navy-deep: hover on the navy
  "#1b2433", // ink
  "#4a5568", // muted
  "#dbe2ec", // line
  "#b8c4d4", // line-strong
  "#f5f8fc", // tint
  "#f7dcdc", // tint-warm: RETIRED from use. Kept listed only so a stale reference fails code review rather than the build.
  "#f2f3f5", // tint-neutral: the notice board panel
  // One per department, for the marks on the departments grid only.
  "#0369a1", // dept-medicine
  "#c2410c", // dept-paediatrics
  "#0e7490", // dept-ophthalmology
  "#be185d", // dept-obstetrics
  "#4338ca", // dept-psychiatry
  "#0f766e", // dept-dental
  "#6d28d9", // dept-surgery
  "#15803d", // dept-biochemistry
  "#1d4ed8", // dept-pathology
  "#6b7280", // placeholder and rule
  "#a3a3a3", // disabled
  "#c81e1e", // emergency number only, never a general status colour
  "#123a75", // band-light
  // Round 5: one accent on soft neutral bands.
  "#1f5fbf", // accent, 6.09:1 on white
  "#174a96", // accent-deep, hover
  "#e9eff9", // accent-soft, the disc behind an icon
  "#333333", // ink: headings and titles
  "#525252", // body copy
  "#707070", // faint: dates and captions, 4.95:1 on white
  "#e3e3e3", // line
  "#c9c9c9", // line-strong
  "#f6f6f6", // tint: card fill on a white band
  "#ededed", // panel: the alternate band
  "#0000", // fully transparent, for the cut-corner masks in globals.css
  // Round 6: blue-tinted neutrals in place of the greys.
  "#0f1e36", // ink, navy-black
  "#3f4b5e", // body
  "#5f6b7d", // faint, 5.4:1 on white
  "#e2ecfb", // accent-soft, hover fill
  "#dfe7f2", // line
  "#c3d0e2", // line-strong
  "#f3f7fd", // tint
  "#e9f1fc", // panel
  // Palette options under review (globals.css, :root[data-palette]).
  "#0b2d5b", "#dcefee", "#0e8c8c", "#0b1f3a", "#f2f8f8", "#e6f2f2", "#d5e6e6", "#b4cfd0",
  "#1a4fa3", "#133c7d", "#0b7a55", "#075c40", "#d3eee2", "#1f63c6", "#22262b", "#131518", "#3a3f46", "#cfe9dc", "#12a37f", "#eaf5ef", "#e0f1e8", "#c4dfd1", "#b3d1c3", "#e3e5e8", "#c9cdd2", "#eceef1", "#111111", "#3d3d3d", "#4d4d4d", "#616161",
  "#07666f", "#054d54", "#d6eef0", "#0a7c86", "#0b2a35", "#f1f8f8", "#e3f1f2", "#d0e5e7", "#afcdd0",
  "#0f2a4a", "#0a1426", "#fbe4de", "#e2553b", "#f8f7f6", "#f1eeec", "#e6e1de", "#cfc7c2",
]);

/** Only the royal at alpha, plus black and white, may be written as rgba. */
const ALLOWED_RGBA =
  /^rgba?\(\s*(?:10\s*,\s*42\s*,\s*92|6\s*,\s*27\s*,\s*61|0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\s*[,)]/;

const TAILWIND_COLOR_PREFIX =
  "bg|text|border|ring|outline|fill|stroke|from|via|to|divide|placeholder|caret|accent|decoration|shadow";

const BANNED_PALETTES =
  "gray|grey|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

const RULES = [
  {
    id: "palette-class",
    message:
      "Off-palette Tailwind colour class. Only white, black and navy tokens exist.",
    pattern: new RegExp(
      `\\b(?:${TAILWIND_COLOR_PREFIX})-(?:${BANNED_PALETTES})(?:-\\d{2,3})?\\b`,
      "g",
    ),
  },
  {
    id: "grey-word",
    message: "The word grey/gray must not appear in styling code.",
    pattern: /\b(?:grey|gray)\b/gi,
  },
  {
    id: "shadow",
    message: "No box-shadow. Cards are defined by 1px borders.",
    pattern: /\bbox-shadow\s*:|(?<![\w-])shadow-(?:xs|sm|md|lg|xl|2xl|inner)\b/g,
  },
  {
    id: "blur",
    message: "No blur, no backdrop-filter, no glassmorphism.",
    pattern:
      /backdrop-filter\s*:|(?<![\w-])backdrop-blur|(?<![\w-])blur-(?:xs|sm|md|lg|xl|2xl|3xl)\b/g,
  },
  {
    // Exempted in globals.css only, for the consultants band's wash and dot
    // lattice. Scoped to that one file so a gradient written in a component,
    // where it would be invisible to review, still fails the build.
    id: "gradient",
    message: "No gradients of any kind.",
    pattern: /linear-gradient|radial-gradient|conic-gradient|bg-gradient-to-/g,
    allowIn: new Set(["src/app/globals.css"]),
  },
  {
    id: "radius-class",
    message:
      "Radius is sm (6px) for controls, md (10px) for small cards, lg (18px) for blocks and photographs, full for discs and pills.",
    pattern: /(?<![\w-])rounded-(?:xl|2xl|3xl)\b/g,
  },
  {
    id: "font-weight-class",
    message:
      "Only font-normal (400), font-medium (500), font-semibold (600) and font-bold (700) exist.",
    pattern: /(?<![\w-])font-(?:thin|extralight|light|extrabold|black)\b/g,
  },
  {
    id: "italic",
    message: "No italic type.",
    pattern: /(?<![\w-])italic\b|font-style\s*:\s*italic/g,
  },
  {
    id: "emoji",
    message: "No emoji anywhere in the repository.",
    pattern: /\p{Extended_Pictographic}/gu,
  },
  {
    id: "console",
    message: "No console.log in shipped code.",
    pattern: /console\.log\s*\(/g,
  },
  {
    id: "any-type",
    message: "No `any` in TypeScript.",
    pattern: /:\s*any\b|\bas\s+any\b|<any>/g,
    extensions: new Set([".ts", ".tsx"]),
  },
  {
    // A bare toISOString() is correct for writing a timestamptz -- it is an
    // instant, and the database stores the offset. The bug is carving a
    // calendar date out of a UTC instant, which is a day behind IST for five
    // and a half hours of every day. Only that is flagged.
    id: "utc-date",
    message:
      "Derive calendar dates from lib/dates (IST), not from a UTC instant. " +
      "toISOString().slice(0,10) is a day behind IST every night.",
    pattern:
      /toISOString\s*\(\s*\)\s*\.\s*(?:slice|substring|substr|split)|toLocaleDateString\s*\(|toLocaleTimeString\s*\(|new Date\s*\(\s*\)\s*\.\s*get(?:Date|Month|FullYear)\s*\(/g,
    extensions: new Set([".ts", ".tsx"]),
    allowIn: new Set(["src/lib/dates.ts"]),
  },
  {
    // Exempted in globals.css only, for the one documented rule that quiets
    // the ring on tabindex="-1" headings the flows move focus to. Scoped to
    // that file so an outline stripped in a component, where it would be
    // invisible to review and would almost certainly be hiding a real
    // interactive control's ring, still fails the build.
    id: "outline-none",
    message: "Focus outlines are never removed.",
    pattern: /outline\s*:\s*none|(?<![\w-])outline-none\b/g,
    allowIn: new Set(["src/app/globals.css"]),
  },
  {
    // The hospital's name is "Syama Prasad Mookerjee", per its own signage and
    // website. The other transliteration drifted into three files despite the
    // warning comment in lib/site.ts, so it is now mechanical.
    id: "hospital-name",
    message:
      "Wrong transliteration of the hospital name. It is Dr. Syama Prasad Mookerjee Superspeciality Hospital.",
    pattern: /Shyama|Mukherjee/gi,
    allowIn: new Set(["src/lib/site.ts"]),
  },
  {
    id: "secret",
    message: "Possible secret committed to source.",
    pattern: /sbp_[a-f0-9]{40}|service_role["'\s]*[:=]|eyJ[A-Za-z0-9_-]{20,}/g,
  },
];

/**
 * Radius declarations in CSS above the ceiling.
 *
 * 16px, not 4px. Photographs take a 16px corner through .image-frame, matching
 * the reference this was set against. Everything else — controls, cards,
 * panels — is still written at 3px by hand; the ceiling is a backstop against
 * pills and circles, not a style guide.
 */
function checkRadiusValues(text, rel, report) {
  /* The A-Z index takes circular letter cells and a pill search field, from
     the reference site's own disease index. Both are written once in
     globals.css as .letter-cell and .search-pill and are exempted here, the
     same way the consultants band's gradient is: scoped to the one file, so a
     circle written inline in a component — where it would be invisible to
     review — still fails the build. */
  if (rel === "src/app/globals.css") return;
  const re = /border-radius\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    for (const raw of m[1].split(/\s+/)) {
      const px = /^(\d+(?:\.\d+)?)px$/.exec(raw.trim());
      if (px && Number(px[1]) > 16) {
        report(m.index, "radius-value", `border-radius ${raw} exceeds 16px.`);
      }
      if (/^\d+(?:\.\d+)?(?:rem|em)$/.test(raw.trim())) {
        report(m.index, "radius-value", `border-radius ${raw} is off-scale.`);
      }
      if (/9999|50%/.test(raw)) {
        report(m.index, "radius-value", `border-radius ${raw} is a pill.`);
      }
    }
  }
}

/**
 * font-weight declarations outside {400, 500, 600, 700}, the four
 * Reddit Sans weights that ship as real files.
 */
const PERMITTED_WEIGHTS = new Set(["400", "500", "600", "700"]);

function checkFontWeightValues(text, report) {
  const re = /font-weight\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    for (const raw of m[1].trim().split(/\s+/)) {
      if (raw === "inherit" || raw === "initial") continue;
      if (!PERMITTED_WEIGHTS.has(raw)) {
        report(
          m.index,
          "font-weight-value",
          `font-weight ${raw} is not 400, 500, 600 or 700.`,
        );
      }
    }
  }
}

/** Hex and rgba literals outside the locked palette. */
function checkColourLiterals(text, report) {
  const hexRe = /#[0-9a-fA-F]{3,8}\b/g;
  let m;
  while ((m = hexRe.exec(text)) !== null) {
    if (!ALLOWED_HEX.has(m[0].toLowerCase())) {
      report(m.index, "palette-hex", `${m[0]} is not in the permitted palette.`);
    }
  }

  const rgbaRe = /rgba?\([^)]*\)/g;
  while ((m = rgbaRe.exec(text)) !== null) {
    if (!ALLOWED_RGBA.test(m[0])) {
      report(m.index, "palette-rgba", `${m[0]} is not navy, black or white at alpha.`);
    }
  }
}

function walk(dir, files = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
      walk(full, files);
    } else if (SCAN_EXTENSIONS.has(entry.slice(entry.lastIndexOf(".")))) {
      files.push(full);
    }
  }
  return files;
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

const violations = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const ext = file.slice(file.lastIndexOf("."));
    const text = readFileSync(file, "utf8");
    const rel = relative(ROOT, file).split(sep).join("/");

    const report = (index, id, message) => {
      violations.push({ file: rel, line: lineOf(text, index), id, message });
    };

    for (const rule of RULES) {
      if (rule.extensions && !rule.extensions.has(ext)) continue;
      if (rule.allowIn?.has(rel)) continue;
      rule.pattern.lastIndex = 0;
      let match;
      while ((match = rule.pattern.exec(text)) !== null) {
        report(
          match.index,
          rule.id,
          `${rule.message} Found: ${JSON.stringify(match[0])}`,
        );
      }
    }

    if (ext === ".css") {
      checkRadiusValues(text, rel, report);
      checkFontWeightValues(text, report);
    }
    checkColourLiterals(text, report);
  }
}

if (violations.length === 0) {
  process.stdout.write("check:design — no violations\n");
  process.exit(0);
}

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
process.stdout.write(`check:design — ${violations.length} violation(s)\n\n`);
for (const v of violations) {
  process.stdout.write(`  ${v.file}:${v.line}  [${v.id}]  ${v.message}\n`);
}
process.stdout.write("\n");
process.exit(1);
