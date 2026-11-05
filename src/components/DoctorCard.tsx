import Image from "next/image";
import Link from "next/link";
import { CalendarIcon, ChevronIcon } from "@/components/ui/icons";
import { formatSessionClock } from "@/lib/dates";

export type CardDoctor = {
  id: string;
  full_name: string;
  slug: string;
  designation?: string | null;
  qualifications?: string | null;
  photo_path?: string | null;
  department_name?: string | null;
  is_department_head?: boolean;
  room_no?: string | null;
};

export type CardSession = {
  weekday: number;
  start_time: string;
  end_time: string;
};

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Sessions with the same hours collapse to one line: "Tue, Thu · 2:00 PM – 5:00 PM". */
export function groupSessions(
  sessions: CardSession[],
): { days: string; hours: string }[] {
  const groups = new Map<string, number[]>();
  for (const session of [...sessions].sort((a, b) => a.weekday - b.weekday)) {
    const hours = formatSessionClock(session.start_time, session.end_time);
    const days = groups.get(hours) ?? [];
    if (!days.includes(session.weekday)) days.push(session.weekday);
    groups.set(hours, days);
  }
  return [...groups.entries()].map(([hours, days]) => ({
    days: days.map((day) => SHORT_DAYS[day]).join(", "),
    hours,
  }));
}

export function DoctorCard({
  doctor,
  sessions,
  headingLevel = "h3",
}: {
  doctor: CardDoctor;
  sessions: CardSession[];
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const clinic = groupSessions(sessions);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white">
      {/* Only a real photograph gets a portrait area. */}
      {doctor.photo_path ? (
        <div className="relative aspect-[4/3] bg-tint-neutral">
          <Image
            src={doctor.photo_path}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover object-center"
          />
        </div>
      ) : null}

      <div className="flex grow flex-col p-6">
        <Heading className="font-sans text-21 font-medium leading-dense tracking-tight">
          <Link
            href={`/doctors/${doctor.slug}`}
            className="text-ink no-underline hover:underline"
          >
            {doctor.full_name}
          </Link>
        </Heading>

        <dl className="mb-6 mt-4 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-14">
          {doctor.department_name ? (
            <>
              <dt className="text-muted">Department:</dt>
              <dd className="text-ink">{doctor.department_name}</dd>
            </>
          ) : null}
          {doctor.qualifications ? (
            <>
              <dt className="text-muted">Qualification:</dt>
              <dd className="text-ink">{doctor.qualifications}</dd>
            </>
          ) : null}
          <dt className="text-muted">OPD:</dt>
          <dd className="tnum text-ink">
            {clinic.length > 0
              ? clinic.map((row) => (
                  <span key={row.hours} className="block">
                    {row.days} &middot; {row.hours}
                  </span>
                ))
              : "No OPD sessions scheduled"}
          </dd>
          {doctor.room_no ? (
            <>
              <dt className="text-muted">Room:</dt>
              <dd className="text-ink">{doctor.room_no}</dd>
            </>
          ) : null}
        </dl>

        <div className="mt-auto grid gap-3">
          {clinic.length > 0 ? (
            <Link
              href={`/book?doctor=${doctor.slug}`}
              className="ui-transition inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-bar px-4 text-15 font-medium text-white no-underline hover:bg-bar-deep"
            >
              <CalendarIcon size={16} aria-hidden="true" />
              Book appointment
            </Link>
          ) : null}
          <Link
            href={`/doctors/${doctor.slug}`}
            className="inline-flex items-center justify-center gap-1 text-15 font-medium text-ink no-underline hover:underline"
          >
            View profile
            <ChevronIcon direction="right" />
          </Link>
        </div>
      </div>
    </article>
  );
}
