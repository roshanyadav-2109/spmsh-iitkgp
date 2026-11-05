import type { SVGProps } from "react";

/**
 * The complete icon set. Nine functional marks, 1.5px stroke, currentColor,
 * 16px or 18px. Nothing decorative. If a label reads clearly on its own, it
 * ships without an icon.
 *
 * Icons are presentational by default (aria-hidden). When an icon is the only
 * content of a control, the control carries the accessible name.
 */

type IconProps = Omit<SVGProps<SVGSVGElement>, "width" | "height"> & {
  size?: 16 | 18;
};

function Icon({ size = 16, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
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

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 4h12M2 8h12M2 12h12" />
    </Icon>
  );
}

/**
 * The telephone. Used where a number is a tap target and the label alone
 * ("Emergency") does not say that it dials.
 */
export function PhoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.6 2.5H3.2a1 1 0 0 0-1 1.05 11 11 0 0 0 10.25 10.25 1 1 0 0 0 1.05-1v-2.4a1 1 0 0 0-.8-.98l-1.9-.38a1 1 0 0 0-.96.31l-.72.82a8.4 8.4 0 0 1-3.27-3.27l.82-.72a1 1 0 0 0 .31-.96l-.38-1.9a1 1 0 0 0-.98-.8Z" />
    </Icon>
  );
}

/** Pause: two upright bars. The rail and the ticker share one control. */
export function PauseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3v10M10 3v10" />
    </Icon>
  );
}

/** Play, for the same control once it is paused. */
export function PlayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 3.2l7.5 4.8L5 12.8V3.2Z" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
    </Icon>
  );
}

export function ChevronIcon({
  direction = "down",
  ...props
}: IconProps & { direction?: "up" | "down" | "left" | "right" }) {
  const rotation = { down: 0, up: 180, left: 90, right: -90 }[direction];
  return (
    <Icon {...props} style={{ transform: `rotate(${rotation}deg)`, ...props.style }}>
      <path d="M4 6l4 4 4-4" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="3.5" width="12" height="10.5" rx="1" />
      <path d="M2 6.5h12M5.5 2v3M10.5 2v3" />
    </Icon>
  );
}

export function PrintIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 6V2h7v4" />
      <path d="M4.5 12H3a1 1 0 01-1-1V7a1 1 0 011-1h10a1 1 0 011 1v4a1 1 0 01-1 1h-1.5" />
      <rect x="4.5" y="10" width="7" height="4" rx="1" />
    </Icon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 2v8M5 7.5L8 10.5l3-3" />
      <path d="M2.5 12.5v1h11v-1" />
    </Icon>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 2.5H13.5V6.5" />
      <path d="M13.5 2.5L7.5 8.5" />
      <path d="M12 9.5v3a1 1 0 01-1 1H3.5a1 1 0 01-1-1V5a1 1 0 011-1h3" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </Icon>
  );
}

export function HospitalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 14h11" />
      <path d="M3.5 14V4.5a1 1 0 011-1h7a1 1 0 011 1V14" />
      <path d="M8 6v4M6 8h4" />
      <path d="M6.5 14v-2h3v2" />
    </Icon>
  );
}

export function StethoscopeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 2v3.5a2.5 2.5 0 005 0V2" />
      <path d="M6.5 8v2.5a3.5 3.5 0 007 0V9" />
      <circle cx="13.5" cy="7.5" r="1.4" />
    </Icon>
  );
}

export function FlaskIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 2v4.2L3 12.2A1 1 0 003.9 13.7h8.2a1 1 0 00.9-1.5L9.5 6.2V2" />
      <path d="M5.5 2h5" />
      <path d="M5 9.5h6" />
    </Icon>
  );
}

export function BedIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 12V5" />
      <path d="M2 8.5h12V12" />
      <path d="M2 12h12" />
      <circle cx="5" cy="6.5" r="1.3" />
      <path d="M7.5 8.5V7a.5.5 0 01.5-.5h4.5a1.5 1.5 0 011.5 1.5" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 2.5L14.5 13.5h-13z" />
      <path d="M8 6.5v3M8 11.5v.01" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 8.5l3.5 3.5L13 4.5" />
    </Icon>
  );
}

/** The arrow in the accent disc on every "go" link and cut-corner block. */
export function ArrowUpRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 11L11 5" />
      <path d="M6 5h5v5" />
    </Icon>
  );
}
