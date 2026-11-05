import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/I18nProvider";

/**
 * Numbered step indicator. Visual only (aria-hidden); the live region beside
 * it announces "Step 2 of 4, Date and time" on each change.
 */
export function StepRail({
  steps,
  current,
}: {
  steps: string[];
  /** 1-based. */
  current: number;
}) {
  const t = useT();
  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {t.booking.stepOf(current, steps.length)}, {steps[current - 1]}
      </p>

      {/* Below sm: one line of text over a four-segment bar. */}
      <div aria-hidden="true" className="sm:hidden">
        <p className="text-14 text-body">
          {t.booking.stepOf(current, steps.length)}
          <span className="font-medium text-ink"> · {steps[current - 1]}</span>
        </p>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {steps.map((label, index) => (
            <span
              key={label}
              className={cn(
                "h-1.5 rounded-full",
                index < current - 1
                  ? "bg-highlight"
                  : index === current - 1
                    ? "bg-accent"
                    : "bg-line-strong",
              )}
            />
          ))}
        </div>
      </div>

      <ol aria-hidden="true" className="hidden items-center gap-3 sm:flex">
        {steps.map((label, index) => {
          const number = index + 1;
          const done = number < current;
          const here = number === current;

          return (
            <li key={label} className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={cn(
                  "tnum flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-14 font-medium",
                  done && "bg-highlight text-white",
                  here && "bg-accent text-white",
                  !done && !here && "border-2 border-line-strong bg-white text-body",
                )}
              >
                {done ? <CheckIcon size={16} /> : number}
              </span>
              <span
                className={cn(
                  "truncate text-15",
                  here ? "font-medium text-ink" : done ? "text-ink" : "text-body",
                )}
              >
                {label}
              </span>
              {number < steps.length ? (
                <span
                  className={cn(
                    "h-0.5 min-w-4 flex-1 rounded-full",
                    done ? "bg-highlight" : "bg-line-strong",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
