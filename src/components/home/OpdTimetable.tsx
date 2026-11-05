"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { realPhone, tel } from "@/lib/phone";
import { ButtonLink } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/I18nProvider";

export type TimetableRow = {
  weekday: number;
  doctorName: string;
  doctorSlug: string;
  department: string | null;
  time: string;
};

const DAYS = [
  { weekday: 1, short: "Mon", long: "Monday" },
  { weekday: 2, short: "Tue", long: "Tuesday" },
  { weekday: 3, short: "Wed", long: "Wednesday" },
  { weekday: 4, short: "Thu", long: "Thursday" },
  { weekday: 5, short: "Fri", long: "Friday" },
  { weekday: 6, short: "Sat", long: "Saturday" },
  { weekday: 0, short: "Sun", long: "Sunday" },
];

/**
 * Who sits in OPD on which day. Opens on today (IST, worked out on the
 * server), or on the next day with a clinic when today has none.
 *
 * Phones get all seven days as a grid of chips, so no day is hidden behind a
 * sideways scroll; from lg the days become a rail beside the list.
 */
export function OpdTimetable({
  rows,
  today,
  opdPhone,
}: {
  rows: TimetableRow[];
  today: number;
  opdPhone?: string | null;
}) {
  const t = useT();
  const order = DAYS.map((day) => day.weekday);
  const start = order.indexOf(today);
  const rotated = start < 0 ? order : [...order.slice(start), ...order.slice(0, start)];
  const initial =
    rotated.find((weekday) => rows.some((row) => row.weekday === weekday)) ?? today;

  const [selected, setSelected] = useState(initial);
  const list = rows.filter((row) => row.weekday === selected);
  const dayLong = (weekday: number) => t.days.long[weekday] ?? "";
  const dayShort = (weekday: number) => t.days.short[weekday] ?? "";
  const selectedLong = dayLong(selected);
  const phone = realPhone(opdPhone);

  return (
    <div className="grid gap-5 lg:grid-cols-[200px_1fr] lg:gap-8">
      <div
        role="group"
        aria-label={t.home.opdDay}
        className="grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-1 lg:content-start"
      >
        {DAYS.map((day) => {
          const active = day.weekday === selected;
          const count = rows.filter((row) => row.weekday === day.weekday).length;
          const isToday = day.weekday === today;
          return (
            <button
              key={day.weekday}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(day.weekday)}
              className={cn(
                "ui-transition flex min-h-12 flex-col items-center justify-center rounded-md px-2 py-2 text-center lg:flex-row lg:justify-between lg:px-4 lg:text-left",
                active ? "bg-accent text-white" : "bg-tint text-ink",
              )}
            >
              <span className="text-15 font-medium">
                <span className="lg:hidden">
                  {isToday ? t.home.today : dayShort(day.weekday)}
                </span>
                <span className="hidden lg:inline">
                  {isToday
                    ? t.home.todayDay(dayShort(day.weekday))
                    : dayLong(day.weekday)}
                </span>
              </span>
              <span
                className={cn("tnum text-13", active ? "text-white/80" : "text-faint")}
              >
                {count === 0 ? t.home.noOpd : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg bg-tint p-2 sm:p-3">
        <p aria-live="polite" className="sr-only">
          {t.home.clinicsOn(list.length, selectedLong)}
        </p>
        {list.length === 0 ? (
          <p className="rounded-md bg-white px-4 py-6 text-16 text-body sm:px-5">
            {t.home.noOpdOn(selectedLong)}
            {phone ? (
              <>
                {" "}
                {t.home.callOpdOn}{" "}
                <a href={tel(phone)} className="tnum font-medium text-ink">
                  {phone}
                </a>
                .
              </>
            ) : null}
          </p>
        ) : (
          <ul className="grid gap-2">
            {list.map((row) => (
              <li
                key={`${row.doctorSlug}-${row.time}`}
                className="grid items-center gap-x-6 gap-y-3 rounded-md bg-white px-4 py-4 sm:grid-cols-[170px_1fr_auto] sm:px-5"
              >
                <span className="tnum text-18 font-medium text-ink">{row.time}</span>
                <span className="min-w-0">
                  <Link
                    href={`/doctors/${row.doctorSlug}`}
                    className="block text-16 font-medium text-ink no-underline hover:text-ink hover:underline"
                  >
                    {row.doctorName}
                  </Link>
                  {row.department ? (
                    <span className="block text-15 text-body">{row.department}</span>
                  ) : null}
                </span>
                <ButtonLink
                  href={`/book?doctor=${row.doctorSlug}`}
                  variant="primary"
                  aria-label={t.home.bookDoctor(row.doctorName)}
                  className="w-full sm:w-auto"
                >
                  {t.home.bookShort}
                </ButtonLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
