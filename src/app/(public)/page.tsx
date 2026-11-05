import { AcademicsBand } from "@/components/home/AcademicsBand";
import { DoctorsBand } from "@/components/home/DoctorsBand";
import { DirectorBand } from "@/components/home/DirectorBand";
import { PressBand } from "@/components/home/PressBand";
import { MilestonesBand } from "@/components/home/MilestonesBand";
import { HomeHero } from "@/components/home/HomeHero";
import { NewsCards, type HomeNotice } from "@/components/home/NewsCards";
import { OpdTimetable, type TimetableRow } from "@/components/home/OpdTimetable";
import { QuickActions } from "@/components/home/QuickActions";
import { ServicesBlocks } from "@/components/home/ServicesBlocks";
import { SpecialityPanel } from "@/components/home/SpecialityPanel";
import { SectionHead } from "@/components/ui/Go";
import { markFor } from "@/components/ui/departmentMark";
import { allResearch } from "@/lib/departmentInfo";
import { getSettings } from "@/lib/settings";
import { SITE } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/public";
import { formatSessionClock, todayIST } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";

export const revalidate = 120;

/** The desk records an unavailable service by writing this into its description. */
const NOT_YET = /upcoming|under development|coming soon/i;

export default async function HomePage() {
  const supabase = createPublicClient();
  const t = await getT();

  const [settings, departmentsRes, doctorsRes, schedulesRes, noticesRes, servicesRes] =
    await Promise.all([
      getSettings(),
      supabase
        .from("departments")
        .select("id, name, slug")
        .order("display_order")
        .order("name"),
      supabase
        .from("doctors")
        .select(
          "id, full_name, slug, designation, qualifications, department_id, photo_path, departments(name)",
        )
        .order("display_order")
        .order("full_name"),
      supabase
        .from("doctor_schedules")
        .select("doctor_id, weekday, start_time, end_time")
        .eq("is_active", true)
        .order("weekday"),
      supabase
        .from("announcements")
        .select("id, title, slug, category, published_at")
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(5),
      supabase
        .from("services")
        .select("id, name, slug, description")
        .order("display_order")
        .order("name"),
    ]);

  // A failed read must not be cached as an empty hospital. Throwing here keeps
  // the last good page in place during a background revalidation, and a cold
  // failure falls to (public)/error.tsx, which gives the OPD number.
  const failed = [departmentsRes, doctorsRes, schedulesRes].find((res) => res.error);
  if (failed?.error) {
    throw new Error(`Home page data could not be loaded: ${failed.error.message}`);
  }

  const departments = departmentsRes.data ?? [];
  const doctors = doctorsRes.data ?? [];
  const schedules = schedulesRes.data ?? [];

  const sessionsByDoctor = new Map<string, typeof schedules>();
  for (const row of schedules) {
    const list = sessionsByDoctor.get(row.doctor_id) ?? [];
    list.push(row);
    sessionsByDoctor.set(row.doctor_id, list);
  }

  const doctorCount = (departmentId: string) =>
    doctors.filter((d) => d.department_id === departmentId).length;

  const staffedDepartments = departments.filter((d) => doctorCount(d.id) > 0);
  // Laboratories run no OPD and are not chosen by patients; they stay on
  // /departments.
  const clinicalDepartments = staffedDepartments.filter(
    (d) => !markFor(d.name).laboratory,
  );

  const doctorById = new Map(doctors.map((doctor) => [doctor.id, doctor]));
  const timetable: TimetableRow[] = schedules
    .flatMap((row) => {
      const doctor = doctorById.get(row.doctor_id);
      if (!doctor) return [];
      return [
        {
          weekday: row.weekday,
          start: row.start_time,
          doctorName: doctor.full_name,
          doctorSlug: doctor.slug,
          department: doctor.departments?.name ?? null,
          time: formatSessionClock(row.start_time, row.end_time),
        },
      ];
    })
    .sort((a, b) => a.start.localeCompare(b.start));

  const todayWeekday = new Date(`${todayIST()}T12:00:00Z`).getUTCDay();

  const notices: HomeNotice[] = (noticesRes.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    publishedAt: row.published_at,
  }));

  const allServices = (servicesRes.data ?? []).map((service) => ({
    id: service.id,
    name: service.name,
    slug: service.slug,
    description: service.description,
    upcoming: NOT_YET.test(service.description ?? ""),
  }));
  const openServices = allServices.filter((service) => !service.upcoming).slice(0, 4);
  const plannedServices = allServices
    .filter((service) => service.upcoming)
    .map((service) => service.name);

  // Doctors with a photograph first, so the band leads with faces.
  const bandDoctors = [...doctors]
    .sort((a, b) => Number(Boolean(b.photo_path)) - Number(Boolean(a.photo_path)))
    .slice(0, 4)
    .map((doctor) => ({
      id: doctor.id,
      name: doctor.full_name,
      slug: doctor.slug,
      designation: doctor.designation,
      department: doctor.departments?.name ?? null,
      photoPath: doctor.photo_path,
    }));

  const papers = allResearch().slice(0, 3);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["Hospital", "MedicalOrganization"],
    name: SITE.name,
    url: SITE.url,
    telephone: settings.reception_phone,
    address: settings.hospital_address,
    parentOrganization: {
      "@type": "CollegeOrUniversity",
      name: SITE.institute,
      url: "https://www.iitkgp.ac.in",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomeHero settings={settings} />
      <QuickActions
        emergencyPhone={settings.emergency_phone}
        opdHours={settings.opd_hours_short}
      />

      {timetable.length > 0 ? (
        <section aria-labelledby="opd" className="pb-10 lg:pb-12">
          <div className="page-width">
            <SectionHead
              id="opd"
              title={t.home.opdTimetable}
              link={{ href: "/book", label: t.common.book }}
            />
            {settings.opd_hours_short ? (
              <p className="tnum mt-2 text-15 text-body">
                {t.common.opdHours(settings.opd_hours_short)}
              </p>
            ) : null}
            <div className="mt-6">
              <OpdTimetable
                rows={timetable}
                today={todayWeekday}
                opdPhone={settings.reception_phone}
              />
            </div>
          </div>
        </section>
      ) : null}

      {clinicalDepartments.length > 0 ? (
        <section aria-labelledby="departments" className="bg-white py-10 lg:py-14">
          <div className="page-width">
            <SectionHead id="departments" title={t.home.specialities} />
            <div className="mt-6">
              <SpecialityPanel departments={clinicalDepartments} />
            </div>
          </div>
        </section>
      ) : null}

      <DirectorBand />

      <DoctorsBand doctors={bandDoctors} />

      {openServices.length > 0 ? (
        <ServicesBlocks services={openServices} planned={plannedServices} />
      ) : null}

      <AcademicsBand papers={papers} />

      <MilestonesBand />

      <PressBand />

      {notices.length > 0 ? <NewsCards notices={notices} /> : null}
    </>
  );
}
