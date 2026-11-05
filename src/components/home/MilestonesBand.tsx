import Image from "next/image";
import { SectionHead } from "@/components/ui/Go";
import { HOSPITAL_MILESTONES } from "@/lib/site";
import { getT } from "@/lib/i18n/server";

const PHOTOS = [
  {
    src: "/images/facility/inauguration-ribbon.jpg",
    alt: "Ribbon cutting at the hospital's inauguration",
  },
  {
    src: "/images/facility/inauguration-guests.jpg",
    alt: "Guests at the hospital's inauguration",
  },
  { src: "/images/facility/inauguration-tour.jpg", alt: "Guests touring the hospital" },
];

/**
 * How the hospital came to be: the inauguration photographs beside the dated
 * milestones the hospital and IIT Kharagpur have published.
 */
export async function MilestonesBand() {
  const t = await getT();
  const [lead, ...rest] = PHOTOS;

  return (
    <section aria-labelledby="milestones" className="py-10 lg:py-12">
      <div className="page-width">
        <SectionHead
          id="milestones"
          title={t.home.milestones}
          link={{ href: "/about", label: t.home.ourStory }}
        />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {lead ? (
              <div className="relative col-span-2 aspect-[3/2] overflow-hidden rounded-lg bg-tint">
                <Image
                  src={lead.src}
                  alt={lead.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 640px"
                  className="object-cover"
                />
              </div>
            ) : null}
            {rest.map((photo) => (
              <div
                key={photo.src}
                className="relative aspect-[16/9] overflow-hidden rounded-lg bg-tint"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 320px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <ol className="grid content-start gap-3">
            {HOSPITAL_MILESTONES.map((item, index) => (
              <li
                key={item.year}
                className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-baseline gap-4 rounded-lg bg-tint px-5 py-4"
              >
                <span className="tnum text-21 font-medium text-ink">
                  {item.year === "Next" ? t.home.nextYear : item.year}
                </span>
                <span className="text-15 text-ink">
                  {t.home.milestoneDetails[index] ?? item.detail}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
