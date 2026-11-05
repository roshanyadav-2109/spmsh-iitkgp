import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SettingPhone } from "@/components/SettingValue";
import { ArrowDisc } from "@/components/ui/Go";
import { markFor } from "@/components/ui/departmentMark";
import { realPhone, tel } from "@/lib/phone";
import { getSettings } from "@/lib/settings";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Departments",
  description:
    "Departments at Dr. Syama Prasad Mookerjee Superspeciality Hospital, IIT Kharagpur, with the consultants in each and their clinic days.",
  alternates: { canonical: "/departments" },
};

/** Named by the hospital on its About page; no OPD roster yet. */
const SUPERSPECIALITIES = [
  { name: "Cardiothoracic surgery", icon: "cardiology" },
  { name: "Surgical gastroenterology", icon: "gastroenterology" },
  { name: "Respiratory medicine", icon: "radiology" },
  { name: "Neurosurgery", icon: "neurophysiology" },
  { name: "Transplantation", icon: "transplant" },
  { name: "Trauma", icon: "emergency" },
  { name: "Oncology", icon: "oncology" },
];

type Department = { id: string; name: string; slug: string };

const GRID = "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4";

export default async function DepartmentsPage() {
  const supabase = createPublicClient();

  const [settings, { data: departments }, { data: doctors }] = await Promise.all([
    getSettings(),
    supabase.from("departments").select("id, name, slug").order("name"),
    supabase.from("doctors").select("id, department_id"),
  ]);

  const opdPhone = realPhone(settings.reception_phone);
  const staffedIds = new Set(
    (doctors ?? []).map((d) => d.department_id).filter((id): id is string => !!id),
  );

  // A department with nobody in it is a dead end, so the index leaves it out.
  const staffed = (departments ?? []).filter((d) => staffedIds.has(d.id));
  const clinical = staffed.filter((d) => !markFor(d.name).laboratory);
  const laboratory = staffed.filter((d) => markFor(d.name).laboratory);

  return (
    <div className="page-width pb-16 lg:pb-24">
      <PageHeader crumbs={[{ href: "/", label: "Home" }]} title="Departments" />

      {staffed.length === 0 ? (
        <p className="mt-6 text-16 text-muted">
          The department list is unavailable right now. Call the OPD counter on{" "}
          <span className="tnum">
            <SettingPhone value={settings.reception_phone} />
          </span>
          .
        </p>
      ) : null}

      {clinical.length > 0 ? (
        <section aria-labelledby="clinics" className="mt-4">
          <h2 id="clinics" className="text-center text-32 tracking-tightest">
            OPD departments
          </h2>
          <ul className={`mt-8 ${GRID}`}>
            {clinical.map((department) => (
              <li key={department.id}>
                <DepartmentCard department={department} />
              </li>
            ))}
            <li>
              {/* Same shape as a department card, so the grid reads as one set; it calls the OPD counter. */}
              <a
                href={opdPhone ? tel(opdPhone) : "/contact"}
                className="group ui-transition flex h-full flex-col items-center rounded-lg border border-accent bg-white px-4 py-8 text-center no-underline hover:border-ink"
              >
                <Image
                  src="/icons/line/find-doctor.png"
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16"
                />
                <span className="mt-5 block text-16 font-medium leading-dense text-ink sm:text-18">
                  Not sure which one?
                </span>
                {opdPhone ? (
                  <span className="tnum mt-2 block text-15 text-body">{opdPhone}</span>
                ) : null}
                <span className="mt-auto flex items-center gap-2 pt-5 text-14 text-body group-hover:underline">
                  Call the OPD counter
                  <ArrowDisc size="sm" />
                </span>
              </a>
            </li>
          </ul>
        </section>
      ) : null}

      {laboratory.length > 0 ? (
        <section aria-labelledby="labs" className="mt-16 lg:mt-20">
          <h2 id="labs" className="text-center text-26 tracking-tighter">
            Laboratory services
          </h2>
          <ul className={`mt-8 ${GRID}`}>
            {laboratory.map((department) => (
              <li key={department.id}>
                <DepartmentCard department={department} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="coming-later" className="mt-16 lg:mt-20">
        <h2 id="coming-later" className="text-center text-26 tracking-tighter">
          Coming later
        </h2>
        {/* Planned superspecialities: not links, since there is nothing to open or book yet. */}
        <ul className={`mt-8 ${GRID}`}>
          {SUPERSPECIALITIES.map(({ name, icon }) => (
            <li
              key={name}
              className="flex h-full flex-col items-center rounded-lg border border-dashed border-muted bg-white px-4 py-8 text-center"
            >
              <Image
                src={`/icons/line/${icon}.png`}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16"
              />
              <span className="mt-5 text-16 font-medium leading-dense text-ink sm:text-18">
                {name}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** A department as a card: its icon, its name and a way in. */
function DepartmentCard({ department }: { department: Department }) {
  const mark = markFor(department.name, 64);
  return (
    <Link
      href={`/departments/${department.slug}`}
      className="group ui-transition flex h-full flex-col items-center rounded-lg border border-line bg-white px-4 py-8 text-center no-underline hover:border-ink"
    >
      <span aria-hidden="true">{mark.icon}</span>
      <span className="mt-5 block text-16 font-medium leading-dense text-ink sm:text-18">
        {department.name}
      </span>
      <span className="mt-auto flex items-center gap-2 pt-5 text-14 text-body group-hover:underline">
        Know more
        <ArrowDisc size="sm" />
      </span>
    </Link>
  );
}
