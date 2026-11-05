import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SettingPhone, SettingValue } from "@/components/SettingValue";
import { CalendarIcon, ChevronIcon, PhoneIcon } from "@/components/ui/icons";
import { getSettings, isPlaceholder } from "@/lib/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contact and timings",
  description:
    "Address, telephone numbers, emergency line and OPD timings for Dr. Syama Prasad Mookerjee Superspeciality Hospital, IIT Kharagpur.",
  alternates: { canonical: "/contact" },
};

/** Google's keyless embed of a place search; frame-src already allows google.com. */
const MAP_EMBED =
  "https://www.google.com/maps?q=Dr+Syama+Prasad+Mookerjee+Superspeciality+Hospital%2C+Balarampur%2C+IIT+Kharagpur&output=embed";

const HEADING = "text-26 tracking-tighter lg:text-32 lg:tracking-tightest";

export default async function ContactPage() {
  const settings = await getSettings();

  const desks = [
    {
      label: "OPD counter",
      note: "Appointments and general queries",
      value: settings.reception_phone,
      fallback: "OPD counter number",
    },
    {
      label: "Front desk",
      value: settings.front_desk_phone,
      fallback: "front desk number",
    },
    {
      label: "Hospital office",
      value: settings.office_phone,
      fallback: "office number",
    },
  ];

  const hours = [
    { label: "OPD", value: settings.opd_hours_short, note: "OPD hours", short: true },
    {
      label: "Pharmacy",
      value: settings.pharmacy_timings_text,
      note: "pharmacy timings",
    },
    {
      label: "Laboratory",
      value: settings.laboratory_timings_text,
      note: "laboratory sample collection timings",
    },
  ];

  const email = settings.hospital_email;
  const emailIsReal = !isPlaceholder(email) && /^\S+@\S+\.\S+$/.test(email ?? "");

  return (
    <div className="pb-16 lg:pb-24">
      <div className="page-width">
        <PageHeader
          crumbs={[{ href: "/", label: "Home" }]}
          title="Contact and timings"
        />
      </div>

      {/* Emergency first, full width, the one red band on the page. */}
      <section
        aria-labelledby="emergency-title"
        data-surface="dark"
        className="mt-4 bg-emergency text-white"
      >
        <div className="page-width grid items-center gap-8 py-10 lg:grid-cols-12 lg:py-12">
          <div className="lg:col-span-5">
            <h2
              id="emergency-title"
              className="text-26 tracking-tighter text-white lg:text-32 lg:tracking-tightest"
            >
              Emergency, 24 hours
            </h2>
            <p className="mt-3 text-16 leading-[1.7] text-white">
              Do not wait for OPD hours. Call, or come straight to the emergency
              department.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
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
        </div>
      </section>

      <div className="page-width">
        <section aria-labelledby="phones" className="pt-16 lg:pt-20">
          <h2 id="phones" className={HEADING}>
            Call Us
          </h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {desks.map((desk) => (
              <li key={desk.label} className="rounded-lg border border-line p-6 lg:p-8">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-tint-neutral text-ink">
                  <PhoneIcon size={18} aria-hidden="true" />
                </span>
                <p className="mt-5 text-16 font-medium text-ink">{desk.label}</p>
                {desk.note ? (
                  <p className="mt-1 text-14 text-muted">{desk.note}</p>
                ) : null}
                <p className="tnum mt-3 text-26 font-medium tracking-tight text-ink">
                  <SettingPhone
                    value={desk.value}
                    fallbackNote={desk.fallback}
                    className="text-ink no-underline hover:underline"
                  />
                </p>
              </li>
            ))}
          </ul>
          {emailIsReal ? (
            <p className="mt-5 text-16">
              Email:{" "}
              <a href={`mailto:${email}`} className="text-ink">
                {email}
              </a>
            </p>
          ) : null}
        </section>

        <section aria-labelledby="hours" className="pt-16 lg:pt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="hours" className={HEADING}>
              Timings
            </h2>
            <Link
              href="/book"
              className="ui-transition inline-flex h-12 items-center gap-2 rounded-md bg-bar px-6 text-16 font-medium text-white no-underline hover:bg-bar-deep"
            >
              <CalendarIcon size={16} aria-hidden="true" />
              Book OPD appointment
            </Link>
          </div>
          <dl className="mt-8 grid gap-5 md:grid-cols-3">
            {hours.map((item) => (
              <div key={item.label} className="rounded-lg bg-tint-neutral p-6 lg:p-8">
                <dt className="text-16 font-medium text-ink">{item.label}</dt>
                <dd
                  className={
                    item.short
                      ? "tnum mt-3 text-26 font-medium tracking-tight text-ink"
                      : "mt-3 text-15 leading-[1.6] text-body"
                  }
                >
                  <SettingValue value={item.value} fallbackNote={item.note} />
                </dd>
              </div>
            ))}
          </dl>
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-15">
            {[
              { href: "/doctors", label: "Doctor-wise OPD days" },
              { href: "/announcements", label: "Timing changes and notices" },
              { href: "/emergency", label: "Emergency information" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-1 font-medium text-ink no-underline hover:underline"
                >
                  {link.label}
                  <ChevronIcon direction="right" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="address" className="pt-16 lg:pt-20">
          <h2 id="address" className={HEADING}>
            Visit Us
          </h2>
          <div className="mt-8 grid overflow-hidden rounded-lg border border-line lg:grid-cols-12">
            <div className="flex flex-col p-6 sm:p-8 lg:col-span-4 lg:p-10">
              <p className="text-16 font-medium text-ink">
                Dr. Syama Prasad Mookerjee Superspeciality Hospital
              </p>
              <address className="mt-3 text-16 not-italic leading-[1.7] text-body">
                <SettingValue
                  value={settings.hospital_address}
                  fallbackNote="full postal address of the hospital"
                />
              </address>
              {isPlaceholder(settings.map_embed_url) ? null : (
                <a
                  href={settings.map_embed_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="ui-transition mt-8 inline-flex h-12 w-fit items-center gap-2 rounded-md border border-ink px-6 text-16 font-medium text-ink no-underline hover:bg-tint-neutral"
                >
                  Get directions
                  <ChevronIcon direction="right" />
                </a>
              )}
            </div>
            <div className="relative min-h-80 bg-tint-neutral lg:col-span-8 lg:min-h-[28rem]">
              <iframe
                title="Map showing the hospital at Balarampur, IIT Kharagpur"
                src={MAP_EMBED}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
