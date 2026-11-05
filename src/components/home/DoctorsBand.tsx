import Image from "next/image";
import Link from "next/link";
import { initialsOf } from "@/components/DoctorPortrait";
import { SectionHead } from "@/components/ui/Go";
import { getT } from "@/lib/i18n/server";

export type BandDoctor = {
  id: string;
  name: string;
  slug: string;
  designation: string | null;
  department: string | null;
  photoPath: string | null;
};

/**
 * The first consultants, each as a white card: the photograph when there is
 * one, otherwise a small monogram disc beside the name. A full-size initials
 * square read as a photograph that failed to load.
 */
export async function DoctorsBand({ doctors }: { doctors: BandDoctor[] }) {
  if (doctors.length === 0) return null;
  const t = await getT();

  return (
    <section aria-labelledby="doctors" className="py-10 lg:py-12">
      <div className="page-width">
        <SectionHead
          id="doctors"
          title={t.home.ourDoctors}
          link={{ href: "/doctors", label: t.home.allDoctors }}
        />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {doctors.map((doctor) => (
            <li key={doctor.id}>
              <Link
                href={`/doctors/${doctor.slug}`}
                className="group ui-transition flex h-full items-center gap-4 rounded-lg border-2 border-tint bg-tint p-4 no-underline hover:border-ink hover:bg-white lg:flex-col lg:items-start lg:p-5"
              >
                {doctor.photoPath ? (
                  <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-full lg:aspect-[4/3] lg:h-auto lg:w-full lg:rounded-md">
                    <Image
                      src={doctor.photoPath}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 56px, 260px"
                      className="object-cover"
                    />
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-18 font-medium text-ink"
                  >
                    {initialsOf(doctor.name)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-16 font-medium leading-dense text-ink group-hover:underline">
                    {doctor.name}
                  </span>
                  {doctor.designation ? (
                    <span className="mt-1 block text-14 text-body">
                      {doctor.designation}
                    </span>
                  ) : null}
                  {doctor.department ? (
                    <span className="mt-1 block text-14 font-medium text-ink">
                      {doctor.department}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
