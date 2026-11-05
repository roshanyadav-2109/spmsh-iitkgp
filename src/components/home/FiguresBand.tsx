import Image from "next/image";
import Link from "next/link";
import { ArrowDisc, SectionHead } from "@/components/ui/Go";
import { HOSPITAL_FIGURES } from "@/lib/site";
import { getT } from "@/lib/i18n/server";

type Figure = { value: string; label: string };

function FigureCard({ figure }: { figure: Figure }) {
  return (
    <div className="flex flex-col justify-end rounded-lg bg-white/10 p-5 lg:min-h-44 lg:p-7">
      <p className="tnum text-32 font-medium leading-none text-white lg:text-42">
        {figure.value}
      </p>
      <p className="mt-2 text-15 text-white/80 lg:mt-3 lg:text-16">{figure.label}</p>
    </div>
  );
}

/**
 * The hospital in four figures, around one photograph. The figures are the
 * ones the About page publishes; the count of departments comes from the
 * live list.
 */
export async function FiguresBand({ departments }: { departments: number }) {
  const t = await getT();
  const figures: [Figure, Figure, Figure, Figure] = [
    { value: HOSPITAL_FIGURES.beds, label: t.home.beds },
    { value: HOSPITAL_FIGURES.mdSeats, label: t.home.mdSeats },
    { value: t.home.freeBedsValue, label: t.home.freeBeds },
    departments > 0
      ? { value: String(departments), label: t.home.clinicalDepts }
      : { value: "24×7", label: t.home.emergencyCare },
  ];

  return (
    <section
      aria-labelledby="about"
      data-surface="dark"
      className="bg-accent-deep py-10 lg:py-14"
    >
      <div className="page-width">
        <SectionHead
          id="about"
          title={t.home.figuresTitle}
          link={{ href: "/about", label: t.home.aboutHospital }}
          tone="dark"
        />

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[1fr_1.7fr_1fr] lg:grid-rows-2 lg:gap-5">
          <FigureCard figure={figures[0]} />
          <Link
            href="/about"
            className="group relative order-first col-span-2 block min-h-64 overflow-hidden rounded-lg no-underline lg:order-none lg:col-span-1 lg:row-span-2 lg:min-h-72"
          >
            <Image
              src="/images/first-surgery.jpg"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
            <span aria-hidden="true" className="photo-fade absolute inset-0" />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 lg:p-8">
              <span>
                <span className="block text-21 font-medium leading-dense text-white">
                  {t.home.surgeryBegan}
                </span>
                <span className="mt-2 block text-14 text-white/80">
                  {t.home.aboutHospital}
                </span>
              </span>
              <ArrowDisc />
            </span>
          </Link>
          <FigureCard figure={figures[1]} />
          <FigureCard figure={figures[2]} />
          <FigureCard figure={figures[3]} />
        </div>
      </div>
    </section>
  );
}
