import { EmptyState } from "@/components/ui/EmptyState";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SettingPhone, SettingValue } from "@/components/SettingValue";
import { CalendarIcon, ChevronIcon } from "@/components/ui/icons";
import { isOpdService as isOpd, photoForService as photoFor } from "@/lib/facilities";
import { createPublicClient } from "@/lib/supabase/public";
import { getSettings } from "@/lib/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Services and facilities",
  description:
    "Outpatient clinics, laboratory, diagnostics and in-patient services at Dr. Syama Prasad Mookerjee Superspeciality Hospital, IIT Kharagpur, with timings.",
  alternates: { canonical: "/services" },
};

/** The desk records an unavailable service by writing this into its description. */
const NOT_YET = /upcoming|under development|coming soon/i;

const HEADING = "text-26 tracking-tighter lg:text-32 lg:tracking-tightest";

export default async function ServicesPage() {
  const supabase = createPublicClient();
  const [{ data }, settings] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, slug, description, timings, departments(name, slug)")
      .order("display_order")
      .order("name"),
    getSettings(),
  ]);

  const services = (data ?? []).map((service) => {
    const description = service.description ?? "";
    const available = !NOT_YET.test(description);
    return {
      ...service,
      available,
      opd: isOpd(service.slug, service.name),
      photo: photoFor(service.slug, service.name),
      // Status phrases are shown by the section a service sits in, not repeated as body copy.
      note: available && description ? description : null,
    };
  });

  const available = services.filter((s) => s.available);
  const upcoming = services.filter((s) => !s.available);

  return (
    <div className="page-width pb-16 lg:pb-24">
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }]}
        title="Services and facilities"
      />

      {/* Open services: one large card each, photograph and details side by side. */}
      <section aria-labelledby="available" className="mt-4">
        <h2 id="available" className={HEADING}>
          Available Now
        </h2>
        {available.length === 0 ? (
          <EmptyState
            className="mt-6"
            image="no-services"
            title="Services will be listed here"
            description="For a test or service, ask at the reception desk."
          />
        ) : (
          <ul className="mt-8 grid gap-6">
            {available.map((service) => (
              <li key={service.id} id={service.slug} className="scroll-mt-28">
                <article className="grid overflow-hidden rounded-lg border border-line bg-white lg:grid-cols-2">
                  {service.photo ? (
                    <div className="relative aspect-[16/10] bg-tint-neutral lg:aspect-auto lg:min-h-96">
                      <Image
                        src={service.photo.image}
                        alt={service.photo.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-col p-6 sm:p-10">
                    <p className="text-14 font-medium text-ink">Open now</p>
                    <h3 className="mt-2 font-sans text-26 font-medium leading-dense tracking-tight lg:text-32">
                      {service.name}
                    </h3>
                    {service.note ? (
                      <p className="mt-4 text-16 leading-[1.7] text-body">
                        {service.note}
                      </p>
                    ) : null}
                    <dl className="mt-6 grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-3 text-15">
                      {service.timings ? (
                        <>
                          <dt className="text-muted">Timings:</dt>
                          <dd className="tnum text-ink">{service.timings}</dd>
                        </>
                      ) : null}
                      {service.departments ? (
                        <>
                          <dt className="text-muted">Department:</dt>
                          <dd>
                            <Link
                              href={`/departments/${service.departments.slug}`}
                              className="text-ink"
                            >
                              {service.departments.name}
                            </Link>
                          </dd>
                        </>
                      ) : null}
                      <dt className="text-muted">Enquiries:</dt>
                      <dd className="tnum text-ink">
                        <SettingPhone value={settings.reception_phone} />
                      </dd>
                    </dl>
                    {service.opd ? (
                      <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-3 pt-8">
                        <Link
                          href="/book"
                          className="ui-transition inline-flex h-12 items-center justify-center gap-2 rounded-md bg-bar px-6 text-16 font-medium text-white no-underline hover:bg-bar-deep"
                        >
                          <CalendarIcon size={16} aria-hidden="true" />
                          Book appointment
                        </Link>
                        <Link
                          href="/appointment/status"
                          className="inline-flex items-center gap-1 text-16 font-medium text-ink no-underline hover:underline"
                        >
                          Check a booking
                          <ChevronIcon direction="right" />
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Numbers and timings as four equal tiles. */}
      <section aria-labelledby="desk" className="mt-16 lg:mt-20">
        <h2 id="desk" className={HEADING}>
          Timings and Enquiries
        </h2>
        <dl className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-tint-neutral p-6">
            <dt className="text-15 font-medium text-ink">OPD counter</dt>
            <dd className="tnum mt-3 text-21 font-medium text-ink">
              <SettingPhone
                value={settings.reception_phone}
                fallbackNote="OPD counter number"
              />
            </dd>
          </div>
          <div className="rounded-lg bg-tint-neutral p-6">
            <dt className="text-15 font-medium text-ink">Front desk</dt>
            <dd className="tnum mt-3 text-21 font-medium text-ink">
              <SettingPhone
                value={settings.front_desk_phone}
                fallbackNote="front desk number"
              />
            </dd>
          </div>
          <div className="rounded-lg bg-tint-neutral p-6">
            <dt className="text-15 font-medium text-ink">Pharmacy</dt>
            <dd className="mt-3 text-15 leading-[1.6] text-body">
              <SettingValue
                value={settings.pharmacy_timings_text}
                fallbackNote="pharmacy timings"
              />
            </dd>
          </div>
          <div className="rounded-lg bg-tint-neutral p-6">
            <dt className="text-15 font-medium text-ink">Laboratory</dt>
            <dd className="mt-3 text-15 leading-[1.6] text-body">
              <SettingValue
                value={settings.laboratory_timings_text}
                fallbackNote="laboratory sample collection timings"
              />
            </dd>
          </div>
        </dl>
      </section>

      {/* Services not yet open: photograph cards, three to a row. */}
      {upcoming.length > 0 ? (
        <section aria-labelledby="upcoming" className="mt-16 lg:mt-20">
          <h2 id="upcoming" className={HEADING}>
            Coming Soon
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((service) => (
              <li
                key={service.id}
                className="overflow-hidden rounded-lg border border-line bg-white"
              >
                {service.photo ? (
                  <div className="relative aspect-[16/10] bg-tint-neutral">
                    <Image
                      src={service.photo.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <h3 className="px-6 py-5 font-sans text-18 font-medium leading-dense tracking-normal">
                  {service.name}
                </h3>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
