import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * A consultant's portrait, or the mark that stands in for one.
 *
 * No doctor record in this build carries a photograph yet, and the frame used
 * to render anyway: a bordered, tinted, empty rectangle, twenty-two of them on
 * the home page and eleven down /doctors. A bordered empty box does not read as
 * "no photograph"; it reads as a photograph that failed to load, which is to
 * say as a broken page, on exactly the routes credibility is decided on.
 *
 * So the null branch is now a deliberate object rather than an absence: the
 * consultant's initials, set in the display voice at 32px, brand-deep on the
 * panel. That is 14.06:1, far past the 4.5:1 body-text floor, and it is
 * something a reader can use — it tells them apart in a row of eleven.
 *
 * The frame, the ratio and the 1px --color-line border are identical in both
 * branches, so a list where one consultant has a photograph and ten do not
 * still sets as one list.
 */

/**
 * "Dr. Rajarshi Sarkar" becomes "RS". The honorific is dropped — every name in
 * the table carries it, so keeping it would give every consultant on the page
 * the same first letter. Two letters at most: three is a monogram on a shirt
 * cuff, not a name mark.
 */
export function initialsOf(fullName: string): string {
  const words = fullName
    .replace(/[^\p{L}\p{N}\s.'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !/^(dr|prof|mr|mrs|ms|smt|shri|sri)\.?$/i.test(word));
  const letters = words.map((word) => word.match(/\p{L}/u)?.[0] ?? "").filter(Boolean);
  if (letters.length === 0) return "—";
  return (letters[0] + (letters[letters.length - 1] ?? "")).slice(0, 2).toUpperCase();
}

export function DoctorPortrait({
  fullName,
  photoPath,
  sizes,
  className,
}: {
  fullName: string;
  photoPath?: string | null;
  /** What the rendered frame actually measures, so the optimizer is asked
      for a candidate width that exists rather than for 3840. */
  sizes: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden image-frame border border-line bg-panel",
        className,
      )}
    >
      {photoPath ? (
        <Image
          src={photoPath}
          alt={fullName}
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        /* aria-hidden: the name is set beside this in every caller, and a
           screen reader announcing "R S" before it would be noise. */
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center text-32 font-medium text-ink"
        >
          {initialsOf(fullName)}
        </span>
      )}
    </div>
  );
}
