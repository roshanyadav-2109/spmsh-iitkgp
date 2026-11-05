import { cn } from "@/lib/cn";

/** Monday to Saturday: the days an OPD can run. */
const WEEK = [1, 2, 3, 4, 5, 6] as const;
const LETTER = ["S", "M", "T", "W", "T", "F", "S"];
const NAME = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * The week as on the printed OPD board: Monday to Saturday, the clinic days
 * filled. Screen readers get the day names instead of the letters.
 */
export function ClinicWeek({
  days,
  size = "md",
  className,
}: {
  /** Weekday numbers, 0 = Sunday. */
  days: Iterable<number>;
  size?: "sm" | "md";
  className?: string;
}) {
  const on = new Set(days);
  const names = WEEK.filter((d) => on.has(d)).map((d) => NAME[d]);
  const box = size === "sm" ? "h-6 w-6 text-12" : "h-7 w-7 text-12";

  return (
    <div className={className}>
      <p className="sr-only">Clinic days: {names.length ? names.join(", ") : "none"}</p>
      <ol aria-hidden="true" className="flex gap-1">
        {WEEK.map((d) => (
          <li
            key={d}
            className={cn(
              "flex items-center justify-center rounded-sm",
              box,
              on.has(d)
                ? "bg-ink font-medium text-white"
                : "border border-line text-muted",
            )}
          >
            {LETTER[d]}
          </li>
        ))}
      </ol>
    </div>
  );
}
