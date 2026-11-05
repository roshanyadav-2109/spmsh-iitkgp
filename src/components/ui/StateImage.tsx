import Image from "next/image";
import { cn } from "@/lib/cn";

/** Pictures in public/images/states, one per patient-facing message. */
const STATES = {
  "not-found": [296, 185],
  error: [319, 186],
  offline: [281, 190],
  updating: [316, 188],
  loading: [302, 186],
  "coming-soon": [300, 169],
  "no-results": [288, 165],
  "no-doctor": [297, 167],
  "no-notices": [300, 162],
  "no-services": [317, 173],
  "booking-closed": [285, 167],
  "no-dates": [298, 177],
  "day-full": [311, 181],
  "on-leave": [300, 172],
  "opd-closed": [323, 175],
  "closed-today": [276, 140],
  "check-form": [333, 155],
  "booking-not-found": [313, 167],
  "cancel-by-phone": [339, 181],
  "cancel-confirm": [295, 187],
  booked: [267, 107],
  cancelled: [276, 80],
} as const;

export type StateName = keyof typeof STATES;

/** Decorative: the message beside it carries the meaning, so alt is empty. */
export function StateImage({
  name,
  className,
}: {
  name: StateName;
  className?: string;
}) {
  const [width, height] = STATES[name];
  return (
    <Image
      src={`/images/states/${name}.webp`}
      alt=""
      width={width}
      height={height}
      sizes="240px"
      className={cn("h-auto", className)}
    />
  );
}
