import Image from "next/image";
import Link from "next/link";
import { GoText, SectionHead } from "@/components/ui/Go";
import { photoForService } from "@/lib/facilities";
import { serviceIcon } from "@/lib/lineIcons";
import { cn } from "@/lib/cn";
import { getT } from "@/lib/i18n/server";

export type HomeService = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

/**
 * The services that are open now, each with the photograph the services page
 * pairs with it and a link to its own entry there. Services the desk lists
 * as upcoming are named once, in a line under the cards, not given cards of
 * their own.
 */
export async function ServicesBlocks({
  services,
  planned,
}: {
  services: HomeService[];
  planned: string[];
}) {
  const single = services.length === 1;
  const t = await getT();

  return (
    <section aria-labelledby="services" className="bg-white py-10 lg:py-14">
      <div className="page-width">
        <SectionHead
          id="services"
          title={t.home.ourServices}
          link={{ href: "/services", label: t.home.allServices }}
        />
        <ul
          className={cn(
            "mt-6 grid gap-4 lg:gap-5",
            single ? "" : "sm:grid-cols-2 lg:grid-cols-4",
          )}
        >
          {services.map((service) => {
            const photo = photoForService(service.slug, service.name);
            return (
              <li key={service.id}>
                <Link
                  href={`/services#${service.slug}`}
                  className={cn(
                    "group ui-transition grid h-full overflow-hidden rounded-lg border-2 border-tint bg-tint no-underline hover:border-ink hover:bg-white",
                    single && "md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]",
                  )}
                >
                  {photo ? (
                    <span className="relative block aspect-[3/2] md:self-center">
                      <Image
                        src={photo.image}
                        alt={photo.alt}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </span>
                  ) : null}
                  <span className="flex flex-col gap-3 p-6 lg:p-8">
                    <span className="text-21 font-medium leading-dense text-ink group-hover:underline">
                      {service.name}
                    </span>
                    {service.description ? (
                      <span className="line-clamp-3 text-15 text-body">
                        {service.description}
                      </span>
                    ) : null}
                    <span className="mt-auto pt-2">
                      <GoText>{t.home.detailsTimings}</GoText>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {planned.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-18 font-medium text-ink">{t.home.openingSoon}</h3>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
              {planned.map((name) => {
                const drawn = serviceIcon(name);
                return (
                  <li
                    key={name}
                    className="flex flex-col items-start gap-3 rounded-lg bg-tint p-4"
                  >
                    {drawn ? (
                      <Image
                        src={drawn}
                        alt=""
                        width={192}
                        height={192}
                        sizes="48px"
                        className="h-12 w-12"
                      />
                    ) : null}
                    <span className="text-14 font-medium leading-dense text-ink">
                      {name}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
