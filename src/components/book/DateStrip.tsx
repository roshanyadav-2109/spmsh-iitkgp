"use client";

import { availabilityLabel, type AvailabilityRow } from "@/components/AvailabilityRows";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/dates";
import { useT } from "@/lib/i18n/I18nProvider";
import { weekdayOf, type Dict } from "@/lib/i18n";

/** Two or three words for a day card; the full reason is read out alongside. */
function shortState(row: AvailabilityRow, t: Dict): string {
  const w = t.booking.tile;
  if (row.is_open) {
    return w.open;
  }
  switch (row.reason_code) {
    case "SLOT_FULL":
      return w.full;
    case "DOCTOR_LEAVE":
      return w.onLeave;
    case "SESSION_CANCELLED":
      return w.cancelled;
    case "HOSPITAL_HOLIDAY":
    case "PAST_CUTOFF":
      return w.closed;
    case "NO_OPD":
      return w.noOpd;
    default:
      return w.unavailable;
  }
}

/**
 * The booking window as a row of day cards. Closed days stay visible with a
 * short reason, so a missing Thursday reads as "On leave" rather than a gap.
 */
export function DateStrip({
  rows,
  selectedDate,
  onSelect,
  name = "on-date",
}: {
  rows: AvailabilityRow[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
  name?: string;
}) {
  const t = useT();
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{t.booking.dateLabel}</legend>
      <ul className="-mx-1 grid auto-cols-[minmax(76px,1fr)] grid-flow-col gap-2.5 overflow-x-auto px-1 pb-2 pt-1">
        {rows.map((row) => {
          const disabled = !row.is_open;
          const selected = selectedDate === row.on_date;
          const inputId = `${name}-${row.on_date}`;
          const [, month] = formatDate(row.on_date).split(" ");
          const day = row.on_date.slice(8, 10).replace(/^0/, "");

          return (
            <li key={row.on_date}>
              <label
                htmlFor={inputId}
                className={cn(
                  "ui-transition flex h-full flex-col items-center rounded-lg border-2 px-2 py-3.5 text-center",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                  disabled &&
                    "cursor-not-allowed border-dashed border-line-strong bg-tint-neutral text-faint",
                  !disabled &&
                    !selected &&
                    "cursor-pointer border-line-strong bg-white text-ink hover:border-ink",
                  selected && "cursor-pointer border-accent bg-accent text-white",
                )}
              >
                <input
                  id={inputId}
                  type="radio"
                  name={name}
                  value={row.on_date}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => onSelect(row.on_date)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "text-13 font-medium",
                    selected ? "text-white" : disabled ? "text-faint" : "text-ink",
                  )}
                >
                  {t.days.short[weekdayOf(row.on_date)]}
                </span>
                <span className="tnum mt-1.5 text-26 font-medium leading-none">
                  {day}
                </span>
                <span
                  className={cn("mt-1 text-12", selected ? "text-white" : "text-faint")}
                >
                  {month}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "tnum mt-2.5 inline-flex items-center gap-1.5 whitespace-nowrap text-12 font-medium",
                    selected ? "text-white" : disabled ? "text-faint" : "text-ink",
                  )}
                >
                  {disabled ? null : (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        selected ? "bg-white" : "bg-accent",
                      )}
                    />
                  )}
                  {shortState(row, t)}
                </span>
                <span className="sr-only">, {availabilityLabel(row, t, false)}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
