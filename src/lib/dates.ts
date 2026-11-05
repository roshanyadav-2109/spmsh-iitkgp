/**
 * Dates and times, always in Asia/Kolkata.
 *
 * This matters more than it looks. IST is UTC+5:30, so for five and a half
 * hours out of every twenty-four the Indian date is a day ahead of the UTC
 * date. `new Date().toISOString().slice(0, 10)` is therefore wrong every
 * single night, and would book people onto the wrong day. Nothing in this
 * codebase computes a date that way; `check:design` fails the build if it
 * finds one.
 *
 * Storage is `timestamptz` and plain `date`. Display is 24-hour time and
 * `26 Jul 2026`. Data uses `2026-07-26`.
 */

export const TIMEZONE = "Asia/Kolkata";

const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const uiDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIMEZONE,
  weekday: "long",
});

/** Today in IST as `2026-07-26`. */
export function todayIST(): string {
  return isoDateFormatter.format(new Date());
}

/** The current IST wall-clock time as `14:30`. */
export function nowTimeIST(): string {
  return timeFormatter.format(new Date());
}

/** `2026-07-26` plus n days, still as `2026-07-26`. */
export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  // Midday UTC keeps the arithmetic clear of any offset boundary.
  const base = Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12);
  const moved = new Date(base + days * 86_400_000);
  return `${moved.getUTCFullYear()}-${String(moved.getUTCMonth() + 1).padStart(2, "0")}-${String(
    moved.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** Whole days from `from` to `to`. Negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const parse = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12);
  };
  return Math.round((parse(to) - parse(from)) / 86_400_000);
}

/** `2026-07-26` becomes `26 Jul 2026`. */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return uiDateFormatter.format(
    new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12)),
  );
}

/** `2026-07-26` becomes `Sunday`. */
export function weekdayName(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return weekdayFormatter.format(
    new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12)),
  );
}

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** 0 is Sunday, matching `doctor_schedules.weekday` and Postgres `dow`. */
export function weekdayLabel(weekday: number): string {
  return WEEKDAY_NAMES[weekday] ?? "";
}

/** Postgres `10:00:00` becomes `10:00`. Null-safe. */
export function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  return time.slice(0, 5);
}

/**
 * Postgres `14:00:00` becomes `2:00 PM`.
 *
 * The 24-hour clock is what the database stores and what the staff portal
 * shows, where columns of times have to align and the people reading them work
 * to a roster. It is not what a hospital board in Kharagpur prints, and a
 * patient reading "14:00-17:00" has to stop and convert it. Every public
 * surface — the doctors list, the department pages, the booking flow and the
 * appointment slip — prints the 12-hour form instead.
 *
 * Built from the string rather than from a Date, so it needs no timezone: the
 * value is already an IST wall-clock time, and pushing it through a Date would
 * be the one way to make it drift.
 */
export function formatClock(time: string | null | undefined): string {
  if (!time) return "";
  const [rawHour, rawMinute] = time.split(":");
  const hour = Number(rawHour);
  const minute = rawMinute ?? "00";
  if (!Number.isFinite(hour)) return "";
  const suffix = hour < 12 ? "AM" : "PM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${minute.slice(0, 2)} ${suffix}`;
}

/** A session as `2:00 PM – 5:00 PM`, for every patient-facing surface. */
export function formatSessionClock(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start || !end) return "";
  return `${formatClock(start)} – ${formatClock(end)}`;
}

/** A session as `09:00-13:00`. The 24-hour form, for the staff portal. */
export function formatSession(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start || !end) return "";
  return `${formatTime(start)}-${formatTime(end)}`;
}

/** A timestamptz becomes `26 Jul 2026, 14:30`. */
export function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  return `${uiDateFormatter.format(date)}, ${timeFormatter.format(date)}`;
}

/** The next `count` dates starting today, in IST. */
export function nextDates(count: number, from: string = todayIST()): string[] {
  return Array.from({ length: count }, (_, index) => addDays(from, index));
}
