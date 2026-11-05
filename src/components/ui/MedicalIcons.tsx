import type { SVGProps } from "react";

/**
 * Iconography for the service and department tiles.
 *
 * Drawn as instruments rather than as symbols: a binaural stethoscope with its
 * chestpiece, a ward block, a laboratory flask, an ambulance, a bed with a
 * patient in it. Each one is a thing that exists in this building.
 *
 * Construction is stroke-first on a 48-unit grid at a 3-unit weight, with
 * round caps and joins, and fills reserved for the few parts that are solid in
 * life — earpieces, the chestpiece, wheels, a head. A uniform stroke is what
 * keeps five unrelated objects looking like one set, and at the 32px they are
 * used at, an even weight stays crisp where a hairline outline greys out.
 *
 * They take their colour from the surrounding text and carry no background of
 * their own.
 */

type MarkProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "fill"> & {
  size?: number;
};

function Mark({ size = 32, children, ...props }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Stethoscope: consultation. */
export function StethoscopeMark(props: MarkProps) {
  return (
    <Mark {...props}>
      {/* the binaural tube, ear pieces down to the junction */}
      <path d="M14 9v11a10 10 0 0 0 20 0V9" />
      <circle cx="14" cy="8" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="34" cy="8" r="2.5" fill="currentColor" stroke="none" />
      {/* the stem and the chestpiece */}
      <path d="M24 30v4" />
      <circle cx="24" cy="39" r="5" />
      <circle cx="24" cy="39" r="1.5" fill="currentColor" stroke="none" />
    </Mark>
  );
}

/** Ward block with a cross: departments. */
export function WardMark(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M11 42V11a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v31" />
      <path d="M5 42h38" />
      {/* the cross */}
      <path d="M24 15v10M19 20h10" />
      {/* windows, two ranks */}
      <path d="M17 31h3M28 31h3M17 37h3M28 37h3" />
    </Mark>
  );
}

/** Laboratory flask: diagnostic investigations. */
export function LabMark(props: MarkProps) {
  return (
    <Mark {...props}>
      {/* the flask: neck, shoulders, and the body it drains into */}
      <path d="M20 7v13L10.5 37A4 4 0 0 0 14 43h20a4 4 0 0 0 3.5-6L28 20V7" />
      <path d="M17 7h14" />
      {/* the fill line, and what is in it */}
      <path d="M15 30h18" />
      <circle cx="21" cy="36" r="2" fill="currentColor" stroke="none" />
      <circle cx="28" cy="39" r="1.5" fill="currentColor" stroke="none" />
    </Mark>
  );
}

/** Ambulance: emergency. */
export function AmbulanceMark(props: MarkProps) {
  return (
    <Mark {...props}>
      {/* box body and the cab stepped down in front of it */}
      <path d="M5 14a2 2 0 0 1 2-2h19a2 2 0 0 1 2 2v18" />
      <path d="M28 21h6.6a2 2 0 0 1 1.6.8l5.4 7.2a2 2 0 0 1 .4 1.2V32" />
      <path d="M5 32h38" />
      <path d="M5 14v18" />
      {/* the cross on the flank */}
      <path d="M16.5 18v8M12.5 22h8" />
      <circle cx="15" cy="36" r="4" />
      <circle cx="34" cy="36" r="4" />
    </Mark>
  );
}

/** Hospital bed with a patient: indoor patient department. */
export function BedMark(props: MarkProps) {
  return (
    <Mark {...props}>
      {/* head post, mattress, foot post */}
      <path d="M5 41V15" />
      <path d="M5 29h38v12" />
      <path d="M5 35h38" />
      {/* the patient: head on the pillow, blanket over the body */}
      <circle cx="16" cy="22" r="4.5" />
      <path d="M25 29v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
    </Mark>
  );
}
