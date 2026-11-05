import type { Metadata } from "next";
import Link from "next/link";
import { StatusLookup } from "./StatusLookup";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n/server";
import { realPhone, tel } from "@/lib/phone";
import { StateImage } from "@/components/ui/StateImage";

export const metadata: Metadata = {
  title: "Check a booking",
  description:
    "Check a booking at Dr. Syama Prasad Mookerjee Superspeciality Hospital.",
  alternates: { canonical: "/appointment/status" },
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ ref?: string }> };

export default async function AppointmentStatusPage({ searchParams }: Props) {
  const [settings, t, { ref }] = await Promise.all([
    getSettings(),
    getT(),
    searchParams,
  ]);
  // A scanned slip arrives with ?ref=; only a plausible reference is passed on.
  const initialRef = /^[A-Z0-9-]{4,20}$/i.test(ref ?? "")
    ? (ref ?? "").toUpperCase()
    : "";
  const opd = realPhone(settings.reception_phone);
  const emergency = realPhone(settings.emergency_phone);

  return (
    <div className="page-width py-5 lg:py-8">
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="min-w-0 lg:col-span-8">
          <StatusLookup
            slipInstructions={settings.slip_instructions}
            initialRef={initialRef}
          />
        </div>
        <aside className="grid content-start gap-4 lg:col-span-4">
          <div className="rounded-lg bg-tint p-5">
            <StateImage name="booked" className="w-40" />
            <p className="mt-4 text-16 font-medium text-ink">{t.status.noBooking}</p>
            <Link
              href="/book"
              className="mt-1 inline-block text-15 font-medium text-ink"
            >
              {t.booking.title}
            </Link>
          </div>
          {opd ? (
            <div className="rounded-lg bg-tint p-5">
              <p className="text-16 font-medium text-ink">{t.flow.help}</p>
              <a
                href={tel(opd)}
                className="tnum mt-1 inline-block text-15 font-medium text-ink"
              >
                {t.common.callOpd} {opd}
              </a>
            </div>
          ) : null}
          {emergency ? (
            <p className="text-15 text-body">
              <span className="font-medium text-emergency">{t.booking.emergencyQ}</span>{" "}
              {t.booking.emergencyDontBook}{" "}
              <a href={tel(emergency)} className="tnum font-medium text-emergency">
                {emergency}
              </a>
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
