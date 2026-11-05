/** The colour options under review, shared by the picker and the root layout. */
export const PALETTES = [
  { id: "g", label: "G: Hospital green and blue (chosen)", swatch: ["#0b7a55", "#1f63c6"] },
  { id: "b", label: "B: Blue and green", swatch: ["#1a4fa3", "#12a37f"] },
  { id: "a", label: "A: Navy and teal", swatch: ["#0b2d5b", "#0e8c8c"] },
  { id: "c", label: "C: Teal", swatch: ["#07666f", "#0a7c86"] },
  { id: "d", label: "D: Navy and coral", swatch: ["#0f2a4a", "#e2553b"] },
  { id: "blue", label: "Earlier blue", swatch: ["#1f5fbf", "#e9f1fc"] },
] as const;

/** The palette in @theme, which needs no data-palette attribute. */
export const DEFAULT_PALETTE = "g";

/** Renamed with each new default, so an old choice kept in a browser does not hide it. */
export const PALETTE_KEY = "spm-palette-g";
