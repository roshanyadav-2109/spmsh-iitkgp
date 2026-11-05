import type { ReactNode, SVGProps } from "react";

/**
 * The large line marks on the home page's task blocks and service blocks.
 *
 * Drawn on a 32px grid in a 1.4px stroke, in the body colour, with one small
 * part filled in the accent: the reference's way of keeping a row of icons
 * quiet while still tying them to the one brand colour. Presentational only;
 * the block they sit in carries the label.
 */

type LineIconProps = Omit<SVGProps<SVGSVGElement>, "width" | "height"> & {
  size?: number;
};

function LineIcon({
  size = 40,
  children,
  ...props
}: LineIconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
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

/** The accent detail inside a mark. */
const Fill = ({ d }: { d: string }) => (
  <path d={d} className="fill-highlight stroke-highlight" />
);

export function CalendarMark(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <rect x="4.5" y="7" width="23" height="20" rx="2.5" />
      <path d="M4.5 12.5h23M10.5 4.5v5M21.5 4.5v5" />
      <Fill d="M18.5 17.5h5v5h-5z" />
    </LineIcon>
  );
}

export function TicketMark(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <rect x="6.5" y="4.5" width="19" height="23" rx="2.5" />
      <path d="M11 10.5h10M11 14.5h10M11 18.5h5" />
      <Fill d="M18.4 22.6l2 2 4-4.4-1-.9-3 3.3-1-1z" />
    </LineIcon>
  );
}

export function DoctorMark(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <circle cx="16" cy="9.5" r="4.5" />
      <path d="M6.5 27.5c0-5.5 4.2-9 9.5-9s9.5 3.5 9.5 9" />
      <path d="M12.5 19v4.5a2 2 0 004 0" />
      <Fill d="M19.3 21.6h1.7v-1.7h1.6v1.7h1.7v1.6h-1.7v1.7H21v-1.7h-1.7z" />
    </LineIcon>
  );
}

export function EmergencyMark(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <path d="M8 22.5v-6a8 8 0 0116 0v6" />
      <path d="M5 26.5h22M6 22.5h20v4H6z" />
      <path d="M16 4v2.5M6.5 8l1.8 1.8M25.5 8l-1.8 1.8" />
      <Fill d="M14.7 13.5h2.6v2.6h2.6v2.6h-2.6v2.6h-2.6v-2.6h-2.6v-2.6h2.6z" />
    </LineIcon>
  );
}

export function PinMark(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <path d="M16 28s-8.5-7.4-8.5-14.5a8.5 8.5 0 0117 0C24.5 20.6 16 28 16 28z" />
      <Fill d="M16 10.5a3 3 0 110 6 3 3 0 010-6z" />
    </LineIcon>
  );
}

export function LabMark(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <path d="M12.5 4.5v8L6 24.5a2 2 0 001.8 3h16.4a2 2 0 001.8-3l-6.5-12v-8" />
      <path d="M10.5 4.5h11" />
      <Fill d="M9.2 19h13.6l2.4 4.5a1.4 1.4 0 01-1.3 2H8.1a1.4 1.4 0 01-1.3-2z" />
    </LineIcon>
  );
}

export function WardMark(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <path d="M4 25V8M4 19h24v6M4 25h24" />
      <circle cx="9.5" cy="15" r="2.3" />
      <path d="M13.5 19v-3a1 1 0 011-1h9a4 4 0 014 4" />
      <Fill d="M20.6 5.5h2.3v2.3h2.3v2.3h-2.3v2.3h-2.3v-2.3h-2.3V7.8h2.3z" />
    </LineIcon>
  );
}

export function PillMark(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <rect
        x="4"
        y="12"
        width="24"
        height="9"
        rx="4.5"
        transform="rotate(-40 16 16.5)"
      />
      <Fill d="M10.6 9.3l7 8.3-3.4 2.9a4.5 4.5 0 01-6.3-.6l-.7-.8a4.5 4.5 0 01.6-6.3z" />
    </LineIcon>
  );
}

export function ScanMark(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <circle cx="16" cy="15" r="9.5" />
      <circle cx="16" cy="15" r="4.5" />
      <path d="M6 27.5h20" />
      <Fill d="M16 12.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z" />
    </LineIcon>
  );
}

export function CapMark(props: LineIconProps) {
  return (
    <LineIcon {...props}>
      <path d="M3.5 12.5L16 6.5l12.5 6-12.5 6z" />
      <path d="M8.5 15v6.5c2 2 4.6 3 7.5 3s5.5-1 7.5-3V15" />
      <path d="M28.5 12.5v7" />
      <Fill d="M27.2 19.5h2.6l-.4 3h-1.8z" />
    </LineIcon>
  );
}
