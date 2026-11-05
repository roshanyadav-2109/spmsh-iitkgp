"use client";

import { cn } from "@/lib/cn";
import { formatDate, formatSessionClock, weekdayName } from "@/lib/dates";
import en, { type Dict } from "@/lib/i18n/en";

export type AvailabilityRow = {
  on_date: string;
  is_open: boolean;
  reason_code: string;
  reason: string | null;
  start_time: string | null;
  end_time: string | null;
  capacity: number;
  booked: number;
  next_token: number | null;
  is_full: boolean;
};

/** The one place a date's state is turned into words, so the public flow and
 *  the counter panel can never describe the same session differently. */
export function availabilityLabel(
  row: AvailabilityRow,
  t: Dict = en,
  showCounts = true,
): string {
  const a = t.booking.avail;
  const withReason = (label: string) =>
    row.reason ? `${label} — ${row.reason}` : label;
  if (row.is_open)
    return showCounts ? a.booked(row.booked, row.capacity) : t.booking.tile.open;
  switch (row.reason_code) {
    case "SLOT_FULL":
      return showCounts ? a.full(row.booked, row.capacity) : t.booking.tile.full;
    case "DOCTOR_LEAVE":
      return withReason(a.doctorLeave);
    case "SESSION_CANCELLED":
      return withReason(a.sessionCancelled);
    case "HOSPITAL_HOLIDAY":
      return withReason(a.hospitalClosed);
    case "NO_OPD":
      return t.booking.tile.noOpd;
    case "PAST_CUTOFF":
      return a.pastCutoff;
    case "DATE_CLOSED":
      return row.reason ?? a.notOpen;
    default:
      return row.reason ?? a.notAvailable;
  }
}

/**
 * Plain rows, one per date. Unavailable dates are shown rather than hidden,
 * with the reason in words, so a patient can see that Thursday is leave rather
 * than wondering where Thursday went.
 */
export function AvailabilityRows({
  rows,
  selectedDate,
  onSelect,
  name = "on-date",
  showNextToken = false,
}: {
  rows: AvailabilityRow[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
  name?: string;
  showNextToken?: boolean;
}) {
  return (
    /* No rules between the days. A hairline under each of eight or eleven
       rows was eleven lines of ink doing what the row's own padding and its
       hover tint already do, and the selected row is marked by its fill. */
    <ul>
      {rows.map((row) => {
        const disabled = !row.is_open;
        const selected = selectedDate === row.on_date;
        const inputId = `${name}-${row.on_date}`;

        return (
          <li key={row.on_date}>
            <label
              htmlFor={inputId}
              className={cn(
                "ui-transition grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 px-2 py-3 sm:grid-cols-[auto_minmax(0,9rem)_minmax(0,7rem)_minmax(0,1fr)]",
                disabled && "cursor-not-allowed opacity-40",
                !disabled && "",
                selected && "bg-tint",
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
                className="mt-1 h-4 w-4"
              />
              <span className="tnum text-15">{formatDate(row.on_date)}</span>
              <span className="text-14 text-muted">{weekdayName(row.on_date)}</span>
              <span className="col-start-2 text-14 sm:col-start-auto">
                <span className="tnum">
                  {formatSessionClock(row.start_time, row.end_time)}
                </span>
                {row.start_time ? " · " : ""}
                <span className="tnum">{availabilityLabel(row)}</span>
                {showNextToken && row.is_open && row.next_token ? (
                  <span className="tnum text-muted">
                    {" "}
                    · next token {row.next_token}
                  </span>
                ) : null}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
