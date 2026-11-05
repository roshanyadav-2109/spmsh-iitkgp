import type { SVGProps } from "react";

/**
 * Six marks for the "Discover more about the hospital" cards.
 *
 * Drawn to one spec, so a row of these next to a row
 * of those reads as one set rather than two icon libraries stacked:
 *   - 48x48 viewBox, geometry inside a 40x40 optical cap (roughly x,y 4..44),
 *     so they sit on one baseline across a grid.
 *   - Stroke only. No fills, so no mark outweighs its neighbours.
 *   - One stem width: 3.5 units, round caps, round joins.
 *   - No containers. A mark is a mark, not a badge.
 *   - currentColor throughout, so each takes its colour from the wrapper.
 *     On these cards that colour is the body ink, not a hue — the marks carry
 *     shape, and the page carries no decorative colour.
 *
 * They are deliberately NOT the usual stock set for these six words — no
 * megaphone for announcements, no gear for administration, no generic
 * handset for contact. Those read as clipart because every site uses them.
 * These are the objects a patient actually meets in a hospital building: the
 * ruled directory board in the entrance, the consultant's lanyard badge, the
 * bell on the services counter, the seal on an official paper, the sheet
 * pinned to the notice board, the clock over the OPD desk.
 *
 * Drawn for this build rather than taken from an icon set, so the spec above
 * is held rather than approximated.
 */

type IconProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "fill"> & {
  size?: number;
};

function Icon({ size = 34, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
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

/** Departments. The ruled directory board in an entrance hall. */
export function DirectoryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6" y="7" width="36" height="34" rx="2" />
      <path d="M14 17h10M14 25h20M14 33h14" />
    </Icon>
  );
}

/** Doctors. A lanyard badge: the cord, the clip, the card. */
export function BadgeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 5l6 7 6-7" />
      <path d="M21 12h6" />
      <rect x="9" y="18" width="30" height="24" rx="2" />
      <circle cx="19" cy="27" r="4" />
      <path d="M13 37c1.5-3.5 4.5-4 6-4s4.5.5 6 4" />
      <path d="M30 26h4M30 33h4" />
    </Icon>
  );
}

/** Services and facilities. The call bell on a counter. */
export function CounterBellIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M24 12v-3" />
      <path d="M10 32c0-7.7 6.3-14 14-14s14 6.3 14 14" />
      <path d="M6 32h36" />
      <path d="M12 39h24" />
    </Icon>
  );
}

/** Administration. The seal on an official paper. */
export function SealIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M11 6h18l8 8v13" />
      <path d="M11 6v36h11" />
      <path d="M29 6v8h8" />
      <circle cx="32" cy="34" r="7" />
      <path d="M28 40l-2 6 6-3 6 3-2-6" />
    </Icon>
  );
}

/** Announcements. A sheet pinned to the notice board. */
export function PinnedNoticeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M24 5v5" />
      <circle cx="24" cy="12" r="2.5" />
      <path d="M11 17h26v25l-13-5-13 5z" />
      <path d="M18 26h12M18 33h8" />
    </Icon>
  );
}

/** Contact and timings. The clock over the outpatient desk. */
export function DeskClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="24" cy="22" r="15" />
      <path d="M24 14v8l6 4" />
      <path d="M14 41h20" />
      <path d="M19 37l-1 4M29 37l1 4" />
    </Icon>
  );
}
