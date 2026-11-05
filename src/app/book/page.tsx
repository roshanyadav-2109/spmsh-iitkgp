import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { getT } from "@/lib/i18n/server";
import { BookingFlow } from "./BookingFlow";
import { createPublicClient } from "@/lib/supabase/public";
import { getSettings, isPlaceholder } from "@/lib/settings";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Request an appointment",
  description:
    "Request an appointment at Dr. Syama Prasad Mookerjee Superspeciality Hospital, IIT Kharagpur.",
  alternates: { canonical: "/book" },
};

type Props = { searchParams: Promise<{ doctor?: string; department?: string }> };

export default async function BookPage({ searchParams }: Props) {
  const { doctor: preselectedSlug, department: departmentSlug } = await searchParams;
  const supabase = createPublicClient();

  const [{ data: departments }, { data: doctorRows }, { data: schedules }, settings] =
    await Promise.all([
      supabase
        .from("departments")
        .select("id, name, slug")
        .order("display_order")
        .order("name"),
      supabase
        .from("doctors")
        .select("id, full_name, slug, designation, room_no, department_id")
        .order("display_order")
        .order("full_name"),
      supabase
        .from("doctor_schedules")
        .select("doctor_id, weekday")
        .eq("is_active", true),
      getSettings(),
    ]);

  // Only doctors with at least one active weekly session can be booked.
  const clinicDays = new Map<string, Set<number>>();
  for (const row of schedules ?? []) {
    const days = clinicDays.get(row.doctor_id) ?? new Set<number>();
    days.add(row.weekday);
    clinicDays.set(row.doctor_id, days);
  }
  const doctors = (doctorRows ?? [])
    .filter((row) => clinicDays.has(row.id))
    .map((row) => ({
      id: row.id,
      fullName: row.full_name,
      slug: row.slug,
      designation: row.designation,
      roomNo: row.room_no,
      departmentId: row.department_id,
      // Monday first, Sunday last.
      clinicDays: [...(clinicDays.get(row.id) ?? [])].sort(
        (a, b) => ((a + 6) % 7) - ((b + 6) % 7),
      ),
    }));

  // Offer only departments with a bookable doctor, so no choice leads to an
  // empty list. (Biochemistry/Pathology have OPD schedules in the data while
  // markFor() flags them as labs; that mismatch is for the hospital to settle.)
  const departmentsWithDoctors = new Set(
    doctors.map((doctor) => doctor.departmentId).filter(Boolean),
  );
  const bookableDepartments = (departments ?? []).filter((department) =>
    departmentsWithDoctors.has(department.id),
  );

  const windowDays = Number.parseInt(settings.booking_window_days ?? "7", 10) || 7;
  const emergency = isPlaceholder(settings.emergency_phone)
    ? null
    : (settings.emergency_phone ?? "").trim();

  const t = await getT();
  const b = t.booking;

  const aside = (
    <>
      <Link
        href="/appointment/status"
        className="card card-link hidden border-0 bg-tint p-5 no-underline lg:block"
      >
        <span className="block text-15 font-medium text-ink">{b.alreadyBooked}</span>
        <span className="mt-1 block text-14 text-ink">{t.common.checkCancel}</span>
      </Link>
      <p className="px-1 text-14 text-ink">
        <span className="font-medium text-emergency">{b.emergencyQ}</span>{" "}
        {b.emergencyDontBook}{" "}
        {emergency ? (
          <a
            href={`tel:${emergency.replace(/[^\d+]/g, "")}`}
            className="tnum font-medium text-emergency"
          >
            {emergency}
          </a>
        ) : (
          b.emergencyNumber
        )}
        {" · "}
        <Link href="/emergency">{b.emergencyDept}</Link>
      </p>
    </>
  );

  return (
    <div className="page-width py-5 lg:py-8">
      {doctors.length === 0 ? (
        <div className="mx-auto max-w-3xl">
          <h1 className="text-26 tracking-tighter sm:text-32 sm:tracking-tightest">
            {b.title}
          </h1>
          <EmptyState
            className="mt-6"
            image="booking-closed"
            title={b.closedTitle}
            description={b.closedBody}
            action={<Link href="/contact">{b.info}</Link>}
          />
        </div>
      ) : (
        <BookingFlow
          departments={bookableDepartments.map((d) => ({
            id: d.id,
            name: d.name,
            slug: d.slug,
          }))}
          doctors={doctors}
          windowDays={windowDays}
          preselectedDoctorSlug={preselectedSlug ?? null}
          preselectedDepartmentSlug={departmentSlug ?? null}
          slipInstructions={settings.slip_instructions}
          opdPhone={settings.reception_phone}
          aside={aside}
        />
      )}
    </div>
  );
}
