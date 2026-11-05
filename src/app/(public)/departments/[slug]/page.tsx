import type React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  groupSessions,
  type CardDoctor,
  type CardSession,
} from "@/components/DoctorCard";
import { ClinicWeek } from "@/components/ClinicWeek";
import { PressCard } from "@/components/PressCard";
import { VisitTabs } from "@/components/VisitTabs";
import { ArrowDisc } from "@/components/ui/Go";
import { PRESS } from "@/lib/press";
import { ButtonLink } from "@/components/ui/Button";
import { markFor } from "@/components/ui/departmentMark";
import {
  AlertIcon,
  CalendarIcon,
  ChevronIcon,
  ExternalLinkIcon,
  PhoneIcon,
} from "@/components/ui/icons";
import Image from "next/image";
import { realPhone, tel } from "@/lib/phone";
import { departmentInfo } from "@/lib/departmentInfo";
import { getSettings } from "@/lib/settings";
import { createPublicClient } from "@/lib/supabase/public";
import { formatClock, formatDate, todayIST } from "@/lib/dates";
import { SITE } from "@/lib/site";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

async function getDepartment(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("departments")
    .select("id, name, slug, description, location_note")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const department = await getDepartment(slug);
  if (!department) return { title: "Department not found" };
  return {
    title: department.name,
    description:
      department.description ??
      `${department.name} at ${SITE.name}, ${SITE.institute}. Consultants, clinic days and how to book.`,
    alternates: { canonical: `/departments/${department.slug}` },
  };
}

const KIND_LABEL: Record<string, string> = {
  holiday: "On leave",
  cancelled: "Clinic cancelled",
  modified: "Changed timing",
  extra: "Extra clinic",
};

const DOCTOR_LIMIT = 6;

/** Columns for the tests row, chosen so no card is left alone on a line. */
const TEST_COLUMNS: Record<number, string> = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-3",
};

export default async function DepartmentPage({ params }: Props) {
  const { slug } = await params;
  const department = await getDepartment(slug);
  if (!department) notFound();

  const supabase = createPublicClient();
  const today = todayIST();

  const [settings, { data: doctors }, { data: services }] = await Promise.all([
    getSettings(),
    supabase
      .from("doctors")
      .select(
        "id, full_name, slug, designation, qualifications, registration_no, room_no, photo_path, is_department_head",
      )
      .eq("department_id", department.id)
      .order("is_department_head", { ascending: false })
      .order("display_order")
      .order("full_name"),
    supabase
      .from("services")
      .select("id, name, slug, description, timings")
      .eq("department_id", department.id)
      .order("display_order"),
  ]);

  const doctorList = doctors ?? [];
  const doctorIds = doctorList.map((doctor) => doctor.id);

  const [{ data: schedules }, { data: exceptions }] = await Promise.all([
    doctorIds.length
      ? supabase
          .from("doctor_schedules")
          .select("doctor_id, weekday, start_time, end_time, max_patients, room_no")
          .in("doctor_id", doctorIds)
          .eq("is_active", true)
          .order("weekday")
      : Promise.resolve({ data: [] }),
    doctorIds.length
      ? supabase
          .from("schedule_exceptions")
          .select("id, doctor_id, on_date, kind, start_time, end_time, reason")
          .in("doctor_id", doctorIds)
          .gte("on_date", today)
          .order("on_date")
          .limit(8)
      : Promise.resolve({ data: [] }),
  ]);

  const sessionList = schedules ?? [];
  const changeList = exceptions ?? [];
  const serviceList = services ?? [];
  const doctorNameById = new Map(doctorList.map((d) => [d.id, d.full_name]));

  const info = departmentInfo(department.name);
  const summary = department.description ?? info?.summary ?? undefined;
  const isLab = markFor(department.name, 24).laboratory;
  const shownDoctors = doctorList.slice(0, DOCTOR_LIMIT);

  const conditions = info?.conditions ?? [];
  const whenToCome = info?.whenToCome ?? [];
  const urgent = info?.urgent ?? [];
  const visit = info?.visit ?? [];
  const tests = info?.tests ?? [];
  const research = info?.research ?? [];

  const heading = "text-26 tracking-tighter lg:text-32 lg:tracking-tightest";
  const allDays = new Set(sessionList.map((s) => s.weekday));
  const body = info?.body ?? [];
  const gallery = info?.gallery ?? [];
  const opdPhone = realPhone(settings.reception_phone);
  const highlights = info?.seenHere ?? [];
  // The speciality's name as the reference uses it: "Paediatrics Highlights", "Paediatrics Team".
  const careName = department.name;
  const tabs = [
    highlights.length > 0 && { id: "highlights", label: "Highlights" },
    body.length > 0 && { id: "about", label: "About" },
    { id: "message", label: "Director's Message" },
    { id: "team", label: "Consultants" },
    tests.length > 0 && { id: "tests", label: "Tests" },
    conditions.length > 0 && { id: "conditions", label: "Conditions" },
    visit.length > 0 && { id: "visit", label: "Your Visit" },
    (whenToCome.length > 0 || urgent.length > 0) && {
      id: "when",
      label: "When to Come",
    },
    { id: "news", label: "In the News" },
    research.length > 0 && { id: "research", label: "Research" },
  ].filter((tab): tab is { id: string; label: string } => Boolean(tab));

  // "General Medicine" -> "General" in ink, "Medicine" in the accent; one word goes all accent.
  const words = department.name.split(" ");
  const lead = words.length > 1 ? words.slice(0, -1).join(" ") : "";
  const last = words[words.length - 1];

  return (
    <div className="pb-16 lg:pb-24">
      {/* Hero band: title, the department's mark in a ringed circle, the clinic card. */}
      <section
        aria-labelledby="department-title"
        className="relative overflow-hidden bg-tint-neutral"
      >
        <Waves />
        <div className="page-width relative pb-12 pt-6 lg:pb-14 lg:pt-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-13 text-muted">
              <li className="flex items-center gap-1.5">
                <Link href="/" className="text-muted no-underline hover:underline">
                  Home
                </Link>
                <ChevronIcon direction="right" className="text-muted" />
              </li>
              <li className="flex items-center gap-1.5">
                <Link
                  href="/departments"
                  className="text-muted no-underline hover:underline"
                >
                  Departments
                </Link>
                <ChevronIcon direction="right" className="text-muted" />
              </li>
              <li aria-current="page" className="text-ink">
                {department.name}
              </li>
            </ol>
          </nav>

          <div className="mt-8 grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-4">
              <p className="text-21 font-medium text-ink">Department of</p>
              <h1
                id="department-title"
                className="mt-1 text-40 font-medium tracking-display lg:text-52"
              >
                {lead ? <span className="text-ink">{lead} </span> : null}
                <span className="text-ink">{last}</span>
              </h1>
              {summary ? <p className="mt-4 text-16 text-body">{summary}</p> : null}
            </div>

            <div className="flex justify-center lg:col-span-4" aria-hidden="true">
              <div className="rounded-full border border-dashed border-muted p-5 sm:p-6">
                <div className="flex h-52 w-52 items-center justify-center rounded-full bg-white sm:h-64 sm:w-64">
                  {markFor(department.name, 140).icon}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="rounded-lg bg-white p-6 sm:p-8">
                <h2 className="text-21 tracking-tight">
                  {isLab ? "Laboratory" : "Clinic timings"}
                </h2>
                <dl className="mt-5 grid gap-4 text-15">
                  <div>
                    <dt className="text-14 text-muted">Clinic days</dt>
                    <dd className="mt-2">
                      {allDays.size > 0 ? (
                        <ClinicWeek days={allDays} />
                      ) : (
                        <span className="text-ink">
                          {isLab
                            ? "Tests are ordered by your doctor"
                            : "No OPD sessions scheduled"}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-14 text-muted">OPD hours</dt>
                      <dd className="tnum mt-1 text-ink">{settings.opd_hours_short}</dd>
                    </div>
                    <div>
                      <dt className="text-14 text-muted">Report at</dt>
                      <dd className="mt-1 text-ink">
                        {department.location_note?.trim() ||
                          "OPD counter, ground floor"}
                      </dd>
                    </div>
                  </div>
                </dl>
                {isLab ? null : (
                  <ButtonLink
                    href={`/book?department=${department.slug}`}
                    variant="primary"
                    className="mt-6 w-full"
                  >
                    Book OPD appointment
                  </ButtonLink>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions on a band in the brand colours: three white cards, icon | label. */}
      <section aria-label="Quick actions" className="cta-band">
        <ul className="page-width grid gap-4 py-10 sm:grid-cols-3 lg:gap-8 lg:py-14">
          <CtaCard
            href={`/doctors?department=${department.slug}`}
            icon="find-doctor"
            label="Find a Doctor"
          />
          <CtaCard
            href="/appointment/status"
            icon="check-booking"
            label="Check a Booking"
          />
          {isLab ? (
            <CtaCard
              href={opdPhone ? tel(opdPhone) : "/contact"}
              icon="opd"
              label="Call the OPD Counter"
            />
          ) : (
            <CtaCard
              href={`/book?department=${department.slug}`}
              icon="book-opd"
              label="Book an Appointment"
            />
          )}
        </ul>
      </section>

      <div className="page-width">
        {changeList.length > 0 ? (
          <div className="mt-4 rounded-lg border border-line p-5">
            <h2 className="font-sans text-15 font-medium tracking-normal">
              Upcoming changes
            </h2>
            <ul className="mt-2 grid gap-1.5 text-14 text-body">
              {changeList.map((change) => (
                <li key={change.id}>
                  <span className="tnum font-medium text-ink">
                    {formatDate(change.on_date)}
                  </span>{" "}
                  {doctorNameById.get(change.doctor_id) ?? ""},{" "}
                  {KIND_LABEL[change.kind] ?? change.kind}
                  {change.start_time && change.end_time
                    ? `, ${formatClock(change.start_time)} – ${formatClock(change.end_time)}`
                    : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* In-page tabs, as on the reference: they stay at the top while the page scrolls. */}
      <nav
        aria-label="On this page"
        className="sticky top-0 z-20 mt-10 border-y border-line bg-white"
      >
        <ul className="page-width flex gap-8 overflow-x-auto text-15 [scrollbar-width:none]">
          {tabs.map((tab) => (
            <li key={tab.id} className="shrink-0">
              <a
                href={`#${tab.id}`}
                className="block py-4 text-ink no-underline hover:text-ink hover:underline"
              >
                {tab.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {highlights.length > 0 ? (
        <section
          id="highlights"
          aria-labelledby="highlights-title"
          className="page-width scroll-mt-16 pt-16 lg:pt-20"
        >
          <h2 id="highlights-title" className={heading}>
            {careName} Highlights
          </h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item, index) => (
              <NotchCard key={item} number={index + 1} tone="tinted">
                <span className="text-18 font-medium leading-dense text-ink">
                  {item}
                </span>
              </NotchCard>
            ))}
          </ul>
        </section>
      ) : null}

      {body.length > 0 ? (
        <section
          id="about"
          aria-labelledby="about-title"
          className="page-width scroll-mt-16 pt-16 lg:pt-20"
        >
          <h2 id="about-title" className={heading}>
            About the Department
          </h2>
          <div className="mt-6 grid max-w-4xl gap-4 text-16 leading-[1.7] text-body">
            {body.map((para) => (
              <p key={para.slice(0, 40)}>{para}</p>
            ))}
          </div>
        </section>
      ) : null}

      {/* The Director's words on the hospital, with their source. */}
      <section
        id="message"
        aria-labelledby="message-title"
        className="relative mt-16 scroll-mt-16 overflow-hidden bg-tint-neutral lg:mt-20"
      >
        <Waves />
        <div className="page-width relative py-14 lg:py-16">
          <h2
            id="message-title"
            className="text-center text-32 tracking-tightest lg:text-40 lg:tracking-display"
          >
            Message from the Director
          </h2>
          <div className="mt-10 grid items-center gap-8 lg:grid-cols-12">
            <blockquote className="lg:col-span-4">
              <p className="text-18 leading-[1.6] text-body">
                &ldquo;While this may appear routine elsewhere, for IIT Kharagpur, this
                marks a decisive breakthrough after years of stalemate.&rdquo;
              </p>
              <p className="mt-4 text-13 text-muted">
                On the hospital&rsquo;s first surgery, 28 September 2025.{" "}
                <a
                  href="https://theprint.in/india/first-surgery-conducted-successfully-at-iit-kgps-new-super-speciality-hospital/2753031"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted underline"
                >
                  Source: ThePrint (PTI)
                </a>
              </p>
            </blockquote>
            <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-lg lg:col-span-4">
              <Image
                src="/images/director.jpg"
                alt="Prof. Suman Chakraborty, Director, IIT Kharagpur"
                fill
                sizes="(max-width: 1024px) 80vw, 30vw"
                className="object-cover object-top"
              />
            </div>
            <div className="lg:col-span-4">
              <p className="text-21 font-medium text-ink">Prof. Suman Chakraborty</p>
              <p className="mt-1 text-15 text-muted">Director, IIT Kharagpur</p>
              <div className="mt-4 h-px w-12 bg-muted" />
              <p className="mt-4 text-15 text-ink">IIT Kharagpur, West Bengal</p>
              {isLab ? null : (
                <ButtonLink
                  href={`/book?department=${department.slug}`}
                  variant="secondary"
                  className="mt-6"
                >
                  Book Appointment
                  <ArrowDisc size="sm" />
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        id="team"
        aria-labelledby="team-title"
        className="page-width scroll-mt-16 pt-16 lg:pt-20"
      >
        <h2
          id="team-title"
          className="text-center text-32 font-medium tracking-tightest text-ink lg:text-52 lg:tracking-display"
        >
          {careName} Consultants
        </h2>
        {doctorList.length === 0 ? (
          <EmptyState
            className="mt-10"
            image="no-doctor"
            title="No doctor is listed here yet"
            description="To ask when this department sees patients, call the OPD counter."
          />
        ) : (
          <ul
            className={
              shownDoctors.length < 3
                ? "mt-10 flex flex-wrap justify-center gap-5 [&>li]:w-full sm:[&>li]:w-[24rem]"
                : "mt-10 grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3"
            }
          >
            {shownDoctors.map((doctor) => (
              <li key={doctor.id}>
                <DoctorTile
                  doctor={doctor}
                  sessions={sessionList.filter((s) => s.doctor_id === doctor.id)}
                  bookable={!isLab}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {tests.length > 0 ? (
        <section
          id="tests"
          aria-labelledby="tests-title"
          className="mt-16 scroll-mt-16 bg-tint-neutral py-14 lg:mt-20 lg:py-16"
        >
          <div className="page-width">
            <SectionHead id="tests-title" title="Tests and Investigations" />
            <ul
              className={`mt-10 grid gap-5 sm:grid-cols-2 ${TEST_COLUMNS[tests.length] ?? "lg:grid-cols-4"}`}
            >
              {tests.map((item, index) => (
                <NotchCard key={item} number={index + 1} tone="white">
                  <span className="text-16 font-medium leading-dense text-ink">
                    {item}
                  </span>
                </NotchCard>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {conditions.length > 0 ? (
        <section
          id="conditions"
          aria-labelledby="conditions-title"
          className="mt-16 scroll-mt-16 lg:mt-20"
        >
          <div className="page-width">
            <SectionHead id="conditions-title" title="Conditions We Treat" />
          </div>
          <div className="mt-8 border-y border-line">
            <div className="page-width">
              <div className="overflow-hidden">
                <ul className="-ml-px -mt-px grid sm:grid-cols-2 lg:grid-cols-4">
                  {conditions.map((item) => (
                    <li
                      key={item.name}
                      className="relative border-l border-t border-line px-5 py-8 lg:px-6 lg:py-10"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute -left-1.5 -top-3 z-10 text-14 text-ink"
                      >
                        +
                      </span>
                      <h3 className="font-sans text-18 font-medium tracking-normal text-ink">
                        {item.name}
                      </h3>
                      <p className="mt-2 text-14 text-body">{item.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {visit.length > 0 ? (
        <section
          id="visit"
          aria-labelledby="visit-title"
          className="mt-16 scroll-mt-16 bg-tint-neutral py-14 lg:mt-20 lg:py-16"
        >
          <div className="page-width">
            <SectionHead id="visit-title" title="Your Visit, Step by Step" />
            <div className="mt-10">
              <VisitTabs steps={visit} shots={gallery} />
            </div>
          </div>
        </section>
      ) : null}

      <div className="page-width">
        {whenToCome.length > 0 || urgent.length > 0 ? (
          <section
            id="when"
            aria-labelledby="when-to-come"
            className="scroll-mt-16 pt-16 lg:pt-20"
          >
            <h2 id="when-to-come" className={heading}>
              When to Come
            </h2>
            <div className="mt-8 grid gap-12 lg:gap-16">
              {whenToCome.length > 0 ? (
                <div className="grid gap-6 lg:grid-cols-12 lg:gap-12">
                  <div className="lg:col-span-5">
                    <h3 className="font-sans text-21 font-medium tracking-tight text-ink">
                      Book a clinic visit
                    </h3>
                    <p className="mt-3 text-16 leading-[1.7] text-body">
                      These are problems a doctor should see, but they are not getting
                      worse by the hour. Book a day that suits you, online or at the OPD
                      counter, and bring any earlier prescriptions and test reports.
                    </p>
                    {isLab ? null : (
                      <p className="mt-5 text-16">
                        <Link
                          href={`/book?department=${department.slug}`}
                          className="font-medium text-ink"
                        >
                          Book an OPD appointment
                        </Link>
                      </p>
                    )}
                  </div>
                  <ul className="grid list-disc content-start gap-x-10 gap-y-3 pl-5 text-16 text-ink marker:text-ink sm:grid-cols-2 lg:col-span-7">
                    {whenToCome.map((item) => (
                      <li key={item} className="pl-1">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      {/* Emergency: a full-width red band, the one place on the page that red fills. */}
      {urgent.length > 0 ? (
        <section
          aria-labelledby="emergency-title"
          data-surface="dark"
          className="mt-16 bg-emergency text-white lg:mt-20"
        >
          <div className="page-width grid gap-10 py-12 lg:grid-cols-12 lg:gap-12 lg:py-16">
            <div className="lg:col-span-5">
              <h2
                id="emergency-title"
                className="flex items-center gap-3 text-26 tracking-tighter text-white lg:text-32 lg:tracking-tightest"
              >
                <AlertIcon size={18} aria-hidden="true" />
                Go to emergency now
              </h2>
              <p className="mt-4 text-16 leading-[1.7] text-white">
                These signs can mean an illness is getting worse quickly and needs a
                doctor within minutes. Do not book online or wait for OPD hours; the
                emergency department is open 24 hours.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <a
                  href={`tel:${settings.emergency_phone}`}
                  className="group flex items-center gap-4 rounded-lg bg-white px-5 py-4 no-underline"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emergency text-white">
                    <PhoneIcon size={18} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-14 text-ink">Emergency</span>
                    <span className="tnum block text-32 font-semibold leading-none tracking-tight text-emergency group-hover:underline">
                      {settings.emergency_phone}
                    </span>
                  </span>
                </a>
                <a
                  href={`tel:${settings.ambulance_phone}`}
                  className="group flex items-center gap-4 rounded-lg border-2 border-white px-5 py-4 no-underline"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-emergency">
                    <PhoneIcon size={18} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-14 text-white">Ambulance</span>
                    <span className="tnum block text-32 font-semibold leading-none tracking-tight text-white group-hover:underline">
                      {settings.ambulance_phone}
                    </span>
                  </span>
                </a>
              </div>
              <Link
                href="/emergency"
                className="mt-5 inline-flex items-center gap-1.5 text-16 font-medium text-white"
              >
                Where to find the emergency department
                <ChevronIcon direction="right" />
              </Link>
            </div>
            <ul className="grid list-disc content-start gap-x-10 gap-y-4 pl-5 text-white marker:text-white sm:grid-cols-2 lg:col-span-7 lg:pt-2">
              {urgent.map((item) => (
                <li key={item} className="pl-1 text-16 leading-[1.6]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section
        id="news"
        aria-labelledby="news-title"
        className="page-width scroll-mt-16 pt-16 lg:pt-20"
      >
        <SectionHead
          id="news-title"
          title="In the News"
          action={
            <ButtonLink href="/newsroom" variant="secondary">
              View More
              <ArrowDisc size="sm" />
            </ButtonLink>
          }
        />
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {PRESS.slice(0, 3).map((item) => (
            <li key={item.href}>
              <PressCard item={item} />
            </li>
          ))}
        </ul>
      </section>

      <div className="page-width">
        {serviceList.length > 0 ? (
          <section aria-labelledby="services" className="pt-16 lg:pt-20">
            <h2 id="services" className={heading}>
              Services
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {serviceList.map((service) => (
                <li key={service.id} className="rounded-lg border border-line p-5">
                  <span className="text-16 font-medium text-ink">{service.name}</span>
                  {service.timings ? (
                    <span className="tnum mt-1 block text-14 text-muted">
                      {service.timings}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {research.length > 0 ? (
          <section
            id="research"
            aria-labelledby="research-title"
            className="scroll-mt-16 pt-16 lg:pt-20"
          >
            <h2 id="research-title" className={heading}>
              Research at IIT Kharagpur
            </h2>
            <p className="mt-2 text-15 text-muted">
              Research papers, not treatments offered at the hospital
            </p>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {research.map((paper) => (
                <li key={paper.title}>
                  <a
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group ui-transition flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white no-underline hover:border-ink"
                  >
                    {/* A drawn page, so the card reads as a document before it is read. */}
                    <span
                      aria-hidden="true"
                      className="flex h-44 items-end justify-center bg-tint-neutral px-8 pt-8"
                    >
                      <span className="relative h-full w-36 rounded-t-md border border-b-0 border-line bg-white px-4 pt-5">
                        <span className="absolute right-0 top-0 h-6 w-6 rounded-bl-md border-b border-l border-line bg-tint-neutral" />
                        <span className="block text-12 font-semibold text-ink">
                          PAPER
                        </span>
                        <span className="tnum mt-1 block text-12 text-muted">
                          {paper.year}
                        </span>
                        <span className="mt-3 block h-1.5 w-full rounded-full bg-line" />
                        <span className="mt-2 block h-1.5 w-5/6 rounded-full bg-line" />
                        <span className="mt-2 block h-1.5 w-full rounded-full bg-line" />
                        <span className="mt-2 block h-1.5 w-2/3 rounded-full bg-line" />
                      </span>
                    </span>
                    <span className="flex grow flex-col p-6">
                      <span className="text-14 text-muted">{paper.journal}</span>
                      <span className="mt-2 line-clamp-2 text-16 font-medium leading-[1.45] text-ink group-hover:underline">
                        {paper.title}
                      </span>
                      <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-15 text-ink">
                        Read paper
                        <ExternalLinkIcon size={16} />
                        <span className="sr-only">(opens in a new tab)</span>
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

/**
 * A card with the cut corner from the site's signature, its number sitting
 * in the gap, the way the reference numbers its highlights.
 */
function NotchCard({
  number,
  tone,
  children,
}: {
  number: number;
  tone: "tinted" | "white";
  children: React.ReactNode;
}) {
  return (
    <li className="relative">
      <div
        className={
          tone === "tinted"
            ? "notch-tr flex h-full min-h-32 items-end rounded-lg bg-tint-neutral p-6 pr-16"
            : "notch-tr flex h-full min-h-32 items-end rounded-lg bg-white p-6 pr-16 [--notch-bg:var(--color-tint-neutral)]"
        }
      >
        {children}
      </div>
      <span
        aria-hidden="true"
        className="tnum absolute right-0 top-0 grid h-[52px] w-[52px] place-items-center text-16 font-medium text-ink"
      >
        {String(number).padStart(2, "0")}
      </span>
    </li>
  );
}

/** A section title with a short note beside it and an optional action on the right. */
function SectionHead({
  id,
  title,
  note,
  action,
}: {
  id: string;
  title: string;
  note?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4">
      <div className="flex flex-wrap items-center gap-x-10 gap-y-2">
        <h2
          id={id}
          className="text-26 tracking-tighter lg:text-32 lg:tracking-tightest"
        >
          {title}
        </h2>
        {note ? <p className="max-w-xs text-15 text-body">{note}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Fine wave lines behind the hero, drawn in the hairline colour. Decoration only. */
function Waves() {
  const lines = Array.from({ length: 14 }, (_, i) => i);
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-line"
      viewBox="0 0 1440 520"
      preserveAspectRatio="none"
      fill="none"
    >
      {lines.map((i) => (
        <path
          key={i}
          d={`M0 ${300 + i * 6} C 260 ${180 + i * 9}, 420 ${430 - i * 4}, 720 ${280 + i * 5} S 1180 ${120 + i * 8}, 1440 ${200 + i * 7}`}
          stroke="currentColor"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

/** One doctor as a card: initials, name, qualifications, clinic week and hours, and a booking link. */
function DoctorTile({
  doctor,
  sessions,
  bookable,
}: {
  doctor: CardDoctor;
  sessions: CardSession[];
  bookable: boolean;
}) {
  const clinic = groupSessions(sessions);
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white">
      {/* Only a real photograph gets the portrait area; without one the card starts at the name. */}
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
        <h3 className="font-sans text-21 font-medium leading-dense tracking-tight">
          {doctor.full_name}
        </h3>

        {/* Details as label: value rows. */}
        <dl className="mb-6 mt-4 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-14">
          {doctor.designation ? (
            <>
              <dt className="text-muted">Role:</dt>
              <dd className="text-ink">{doctor.designation}</dd>
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
            {sessions.length > 0
              ? clinic.map((row) => (
                  <span key={row.hours} className="block">
                    {row.days} &middot; {row.hours}
                  </span>
                ))
              : "No OPD sessions scheduled"}
          </dd>
        </dl>

        <div className="mt-auto grid gap-3">
          {bookable && sessions.length > 0 ? (
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

/** One quick action: a white card with the icon, a thin divider and the label. */
function CtaCard({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group ui-transition flex h-full min-h-24 items-center gap-5 rounded-lg bg-white px-6 py-5 no-underline lg:min-h-32 lg:px-10"
      >
        <Image
          src={`/icons/line/${icon}.png`}
          alt=""
          width={56}
          height={56}
          className="h-12 w-12 shrink-0 lg:h-14 lg:w-14"
        />
        <span aria-hidden="true" className="h-12 w-px shrink-0 bg-line-strong" />
        <span className="text-18 font-medium leading-dense text-ink group-hover:underline lg:text-21">
          {label}
        </span>
      </Link>
    </li>
  );
}
