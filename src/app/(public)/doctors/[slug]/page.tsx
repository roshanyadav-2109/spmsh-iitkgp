import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { initialsOf } from "@/components/DoctorPortrait";
import { createPublicClient } from "@/lib/supabase/public";
import { formatClock, formatDate, todayIST, weekdayLabel } from "@/lib/dates";
import { storageUrl } from "@/lib/storage";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

async function getDoctor(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("doctors")
    .select(
      "id, full_name, slug, designation, qualifications, registration_no, room_no, about, photo_path, department_id, departments(name, slug, location_note)",
    )
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doctor = await getDoctor(slug);
  if (!doctor) return { title: "Doctor not found" };
  return {
    title: doctor.full_name,
    description: [doctor.designation, doctor.qualifications, doctor.departments?.name]
      .filter(Boolean)
      .join(". "),
    alternates: { canonical: `/doctors/${doctor.slug}` },
  };
}

type ScheduleRow = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  max_patients: number;
  room_no: string | null;
};

export default async function DoctorPage({ params }: Props) {
  const { slug } = await params;
  const doctor = await getDoctor(slug);
  if (!doctor) notFound();

  const supabase = createPublicClient();

  const [{ data: schedules }, { data: exceptions }] = await Promise.all([
    supabase
      .from("doctor_schedules")
      .select("id, weekday, start_time, end_time, slot_minutes, max_patients, room_no")
      .eq("doctor_id", doctor.id)
      .order("weekday"),
    supabase
      .from("schedule_exceptions")
      .select("id, on_date, kind, start_time, end_time, reason")
      .eq("doctor_id", doctor.id)
      .gte("on_date", todayIST())
      .order("on_date")
      .limit(10),
  ]);

  const photo = storageUrl("doctor-photos", doctor.photo_path);

  const kindLabel: Record<string, string> = {
    holiday: "On leave",
    cancelled: "Session cancelled",
    modified: "Changed timing",
    extra: "Extra session",
  };

  const sessions = (schedules ?? []) as ScheduleRow[];
  const week = [1, 2, 3, 4, 5, 6, 0].map((weekday) => ({
    weekday,
    sessions: sessions.filter((row) => row.weekday === weekday),
  }));

  const facts = [
    { label: "Department", value: doctor.departments?.name },
    { label: "Qualifications", value: doctor.qualifications },
    { label: "Registration no.", value: doctor.registration_no },
    { label: "Room", value: doctor.room_no },
    { label: "Where to report", value: doctor.departments?.location_note },
  ].filter((fact) => Boolean(fact.value));

  return (
    <div className="page-width pb-16 lg:pb-24">
      <PageHeader
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/doctors", label: "Doctors" },
        ]}
        title={doctor.full_name}
        intro={doctor.designation ?? undefined}
        actions={
          sessions.length > 0 ? (
            <ButtonLink
              href={`/book?doctor=${doctor.slug}`}
              variant="primary"
              className="h-12 px-6 sm:h-12"
            >
              Book appointment
            </ButtonLink>
          ) : undefined
        }
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <aside className="lg:col-span-4">
          <div className="card p-6">
            <div className="relative flex aspect-square w-28 items-center justify-center overflow-hidden rounded-md bg-panel">
              {photo ? (
                <Image
                  src={photo}
                  alt={`Photograph of ${doctor.full_name}`}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="font-display text-32 font-medium text-ink"
                >
                  {initialsOf(doctor.full_name)}
                </span>
              )}
            </div>
            <dl className="mt-6 grid gap-4">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-13 text-muted">{fact.label}</dt>
                  <dd className="mt-0.5 text-15">
                    {fact.label === "Department" && doctor.departments ? (
                      <Link
                        href={`/departments/${doctor.departments.slug}`}
                        className="text-ink"
                      >
                        {fact.value}
                      </Link>
                    ) : (
                      fact.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>

        <div className="lg:col-span-8">
          <section aria-labelledby="opd">
            <h2 id="opd" className="text-26 tracking-tighter">
              Weekly OPD
            </h2>
            {sessions.length === 0 ? (
              <p className="mt-4 text-15 text-muted">
                No OPD sessions scheduled. Online booking is closed for this doctor.
              </p>
            ) : (
              <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {week.map((day) => {
                  const open = day.sessions.length > 0;
                  return (
                    <li
                      key={day.weekday}
                      className={
                        open
                          ? "rounded-md border border-accent bg-white p-3"
                          : "rounded-md border border-line bg-tint p-3"
                      }
                    >
                      <p
                        className={
                          open
                            ? "text-14 font-medium text-ink"
                            : "text-14 text-muted"
                        }
                      >
                        {weekdayLabel(day.weekday).slice(0, 3)}
                      </p>
                      {open ? (
                        day.sessions.map((session) => (
                          <p
                            key={session.id}
                            className="tnum mt-1 text-13 leading-dense text-ink"
                          >
                            {formatClock(session.start_time)}
                            <br />
                            to {formatClock(session.end_time)}
                          </p>
                        ))
                      ) : (
                        <p className="mt-1 text-13 text-muted">No OPD</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {(exceptions ?? []).length > 0 ? (
            <section aria-labelledby="changes" className="mt-12">
              <h2 id="changes" className="text-26 tracking-tighter">
                Upcoming changes
              </h2>
              <ul className="mt-4 border-t border-line">
                {(exceptions ?? []).map((exception) => (
                  <li
                    key={exception.id}
                    className="flex flex-wrap gap-x-4 border-b border-line py-3 text-15"
                  >
                    <span className="tnum w-28 shrink-0 text-muted">
                      {formatDate(exception.on_date)}
                    </span>
                    <span>
                      {kindLabel[exception.kind] ?? exception.kind}
                      {exception.start_time && exception.end_time
                        ? `, ${formatClock(exception.start_time)} – ${formatClock(exception.end_time)}`
                        : ""}
                      {exception.reason ? (
                        <span className="block text-14 text-muted">
                          {exception.reason}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {doctor.about ? (
            <section aria-labelledby="about-doctor" className="mt-12">
              <h2 id="about-doctor" className="text-26 tracking-tighter">
                About
              </h2>
              <p className="mt-4 max-w-prose text-16">{doctor.about}</p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
