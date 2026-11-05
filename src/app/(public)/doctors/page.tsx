import type { Metadata } from "next";
import Link from "next/link";
import { DoctorList } from "@/components/DoctorList";
import { PageHeader } from "@/components/PageHeader";
import { departmentMatches } from "@/components/ui/departmentMark";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createPublicClient } from "@/lib/supabase/public";
import { getSettings } from "@/lib/settings";
import { realPhone, tel } from "@/lib/phone";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Doctors",
  description:
    "Doctors at Dr. Syama Prasad Mookerjee Superspeciality Hospital, IIT Kharagpur, with department, qualifications and weekly OPD schedules.",
  alternates: { canonical: "/doctors" },
};

type Props = {
  searchParams: Promise<{ department?: string; q?: string }>;
};

export default async function DoctorsPage({ searchParams }: Props) {
  const { department: departmentSlug, q } = await searchParams;
  const supabase = createPublicClient();

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, slug")
    .order("display_order")
    .order("name");

  const selected = (departments ?? []).find((d) => d.slug === departmentSlug);
  const generalMedicine = (departments ?? []).find((d) =>
    /general medicine|internal medicine/i.test(d.name),
  );
  const opdPhone = realPhone((await getSettings()).reception_phone);
  const search = (q ?? "").trim();

  let query = supabase
    .from("doctors")
    .select(
      "id, full_name, slug, designation, qualifications, room_no, photo_path, department_id, departments(name)",
    )
    .order("display_order")
    .order("full_name");

  if (selected) query = query.eq("department_id", selected.id);

  const { data: rows } = await query;

  const all = (rows ?? []).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    slug: row.slug,
    designation: row.designation,
    qualifications: row.qualifications,
    room_no: row.room_no,
    photo_path: row.photo_path,
    department_name: row.departments?.name ?? null,
  }));

  // Matches names, qualifications and everyday words for a department ("eye", "child").
  const needle = search.toLowerCase();
  const doctors = search
    ? all.filter(
        (doctor) =>
          doctor.full_name.toLowerCase().includes(needle) ||
          (doctor.designation ?? "").toLowerCase().includes(needle) ||
          (doctor.qualifications ?? "").toLowerCase().includes(needle) ||
          departmentMatches(doctor.department_name ?? "", search),
      )
    : all;

  const doctorIds = doctors.map((doctor) => doctor.id);
  const { data: schedules } = doctorIds.length
    ? await supabase
        .from("doctor_schedules")
        .select("doctor_id, weekday, start_time, end_time")
        .in("doctor_id", doctorIds)
        .order("weekday")
    : { data: [] };

  const filtered = Boolean(selected || search);

  return (
    <div className="page-width pb-16 lg:pb-24">
      <PageHeader
        title="Doctors"
        crumbs={[{ href: "/", label: "Home" }]}
        intro="Consultants, their clinic days, and a direct way to book."
      />

      {/* One search row: words, a department, and the button. */}
      <form
        method="get"
        action="/doctors"
        role="search"
        className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_16rem_auto]"
      >
        <label htmlFor="q" className="sr-only">
          Search by name or speciality
        </label>
        <Input
          id="q"
          name="q"
          type="search"
          defaultValue={search}
          placeholder="Search a name or a need, e.g. eye, child, teeth"
          className="h-12 w-full text-16 sm:h-12"
        />
        <label htmlFor="department" className="sr-only">
          Department
        </label>
        <Select
          id="department"
          name="department"
          defaultValue={selected?.slug ?? ""}
          className="[&>select]:h-12 [&>select]:text-16 sm:[&>select]:h-12"
        >
          <option value="">All departments</option>
          {(departments ?? []).map((d) => (
            <option key={d.id} value={d.slug}>
              {d.name}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="primary" className="h-12 px-8 sm:h-12">
          Search
        </Button>
      </form>

      <p className="tnum mt-8 text-14 text-muted" aria-live="polite">
        {selected ? `Showing ${selected.name}` : ""}
        {search ? `${selected ? "," : "Showing"} matching "${search}"` : ""}
        {filtered ? (
          <>
            {" · "}
            <Link href="/doctors" className="text-ink">
              Clear
            </Link>
          </>
        ) : null}
      </p>

      <div className="mt-4">
        {doctors.length === 0 ? (
          <EmptyState
            image="no-results"
            title="No doctor matches your search"
            description="Try a simpler word, like fever, eye or child. Not sure where to start? General Medicine sees adults first."
            action={
              <div className="flex flex-wrap items-center gap-3">
                {generalMedicine ? (
                  <ButtonLink
                    href={`/doctors?department=${generalMedicine.slug}`}
                    variant="primary"
                  >
                    See General Medicine doctors
                  </ButtonLink>
                ) : null}
                {opdPhone ? (
                  <a
                    href={tel(opdPhone)}
                    className="ui-transition inline-flex h-11 items-center rounded-md border border-accent px-5 text-15 font-medium text-ink no-underline"
                  >
                    Call OPD <span className="tnum ml-1.5">{opdPhone}</span>
                  </a>
                ) : null}
                <Link href="/departments" className="text-15 text-ink">
                  See all departments
                </Link>
              </div>
            }
          />
        ) : (
          <DoctorList
            doctors={doctors}
            schedules={schedules ?? []}
            showDepartment
            headingLevel="h2"
          />
        )}
      </div>
    </div>
  );
}
