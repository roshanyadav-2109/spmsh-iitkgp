import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Provide } from "@/components/Provide";
import { SettingValue } from "@/components/SettingValue";
import { telHref } from "@/components/info/PhoneRow";
import { buttonClasses } from "@/components/ui/Button";
import { PhoneIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { getSettings, isPlaceholder } from "@/lib/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Emergency",
  description:
    "Emergency telephone number, ambulance number and where to go for emergency care at Dr. Syama Prasad Mookerjee Superspeciality Hospital, IIT Kharagpur.",
  alternates: { canonical: "/emergency" },
};

const CALL_NOW_IF = [
  "Chest pain or pressure",
  "Difficulty breathing",
  "Collapse or unresponsiveness",
  "Heavy bleeding",
  "Stroke signs: drooping face, arm weakness, slurred speech",
  "Seizures",
  "Severe burns, head injury or road accident",
];

const BRING = [
  "Photo ID, and institute roll or employee number if any",
  "Medicines the patient is taking",
  "Earlier prescriptions or reports, if to hand",
];

function CallButton({
  label,
  value,
  filled,
}: {
  label: string;
  value: string | undefined;
  filled: boolean;
}) {
  const tone = filled
    ? "border-emergency bg-emergency text-white"
    : "border-emergency bg-white text-emergency";

  if (isPlaceholder(value)) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-emergency p-5">
        <span className="text-16 font-medium text-emergency">{label}</span>
        <Provide note={`${label.toLowerCase()} telephone number`} />
      </div>
    );
  }

  return (
    <a
      href={telHref(value ?? "")}
      className={cn(
        "ui-transition flex items-center justify-between gap-4 rounded-md border-2 px-5 py-4 no-underline sm:px-6 sm:py-6",
        tone,
      )}
    >
      <span className="flex flex-col">
        <span className="text-15 font-medium sm:text-16">{label}</span>
        <span className="tnum font-display text-52 font-medium leading-none tracking-display">
          {value}
        </span>
      </span>
      <span
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-sm border-2 px-4 py-2 text-15 font-medium",
          filled ? "border-white" : "border-emergency",
        )}
      >
        <PhoneIcon size={18} />
        Call
      </span>
    </a>
  );
}

export default async function EmergencyPage() {
  const settings = await getSettings();
  const emergencyNumber = isPlaceholder(settings.emergency_phone)
    ? "the emergency number"
    : settings.emergency_phone;

  return (
    <div className="page-width pb-16 lg:pb-24">
      <PageHeader crumbs={[{ href: "/", label: "Home" }]} title="Emergency" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-12">
        <CallButton label="Emergency" value={settings.emergency_phone} filled />
        <CallButton label="Ambulance" value={settings.ambulance_phone} filled={false} />
      </div>
      <p className="mt-4 text-15 font-medium text-ink">
        Do not book online for an emergency.
      </p>

      <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <section aria-labelledby="where" className="lg:col-span-5">
          <h2 id="where" className="text-26 tracking-tighter">
            Where to go
          </h2>
          <div className="card mt-5 p-5">
            <address className="text-16 not-italic">
              <SettingValue
                value={settings.hospital_address}
                fallbackNote="full postal address of the hospital"
              />
            </address>
            {/* The stock default only repeats the address; show the text once the desk has replaced it. */}
            {isPlaceholder(settings.emergency_location_text) ||
            /^for an emergency, call/i.test(
              settings.emergency_location_text ?? "",
            ) ? null : (
              <p className="mt-3 text-14 text-muted">
                {settings.emergency_location_text}
              </p>
            )}
            {isPlaceholder(settings.map_embed_url) ? null : (
              <a
                href={settings.map_embed_url}
                target="_blank"
                rel="noreferrer noopener"
                className={cn(
                  buttonClasses("secondary"),
                  "mt-4 w-full no-underline sm:w-auto",
                )}
              >
                Get directions
              </a>
            )}
          </div>

          <h3 className="mt-8 font-sans text-16 font-medium tracking-normal">
            What to bring
          </h3>
          <ul className="mt-3 grid gap-1.5 text-15">
            {BRING.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="text-muted">
                  &ndash;
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-14 text-muted">Do not delay to collect paperwork.</p>
        </section>
        <section aria-labelledby="call-now" className="lg:col-span-7">
          <h2 id="call-now" className="text-26 tracking-tighter">
            Call {emergencyNumber} immediately for
          </h2>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {CALL_NOW_IF.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-sm border border-line px-4 py-3 text-16"
              >
                <span
                  aria-hidden="true"
                  className="mt-2 h-2 w-2 shrink-0 rounded-sm bg-emergency"
                />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className="mt-12 border-t border-line pt-6 text-15">
        Not an emergency?{" "}
        <Link href="/book" className="text-ink">
          Book an OPD appointment
        </Link>{" "}
        or see{" "}
        <Link href="/contact" className="text-ink">
          contact and timings
        </Link>
        .
      </p>
    </div>
  );
}
