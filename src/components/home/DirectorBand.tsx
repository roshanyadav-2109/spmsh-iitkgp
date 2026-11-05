import Image from "next/image";
import { getT } from "@/lib/i18n/server";

/**
 * The Director of IIT Kharagpur on the hospital. The quoted sentence is
 * verbatim and appears word for word in two independent reports of the
 * institute's statement on the hospital's first surgery, 28 September 2025:
 * ThePrint (PTI) and Dinamalar. Keep the wording exact if this is edited, and
 * keep the source line under it. The quote stays in English in every language,
 * as the hero quote does.
 */
const SOURCE =
  "https://theprint.in/india/first-surgery-conducted-successfully-at-iit-kgps-new-super-speciality-hospital/2753031";

/** `inset` drops the band padding and page width, for use inside a page that already has them. */
export async function DirectorBand({ inset = false }: { inset?: boolean }) {
  const t = await getT();

  return (
    <section
      aria-labelledby="director"
      className={inset ? "mt-14" : "bg-white py-10 lg:py-14"}
    >
      <div className={inset ? undefined : "page-width"}>
        <div
          data-surface="dark"
          className="grid overflow-hidden rounded-lg bg-bar text-white md:grid-cols-12"
        >
          <div className="relative aspect-[4/3] md:col-span-5 md:aspect-auto md:min-h-80 lg:col-span-4">
            <Image
              src="/images/director.jpg"
              alt="Prof. Suman Chakraborty, Director, IIT Kharagpur"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover object-top"
            />
          </div>
          <figure className="flex flex-col justify-center p-6 sm:p-8 md:col-span-7 lg:col-span-8 lg:p-12">
            <h2 id="director" className="text-15 font-medium text-white">
              {t.home.fromDirector}
            </h2>
            <blockquote className="mt-4">
              <p className="text-21 font-medium leading-[1.35] text-white sm:text-26 lg:text-32 lg:leading-[1.25]">
                &ldquo;While this may appear routine elsewhere, for IIT Kharagpur, this
                marks a <span className="text-white">decisive breakthrough</span>{" "}
                after years of stalemate.&rdquo;
              </p>
            </blockquote>
            <figcaption className="mt-6 text-15 leading-dense">
              <span className="block font-medium text-white">
                Prof. Suman Chakraborty
              </span>
              <span className="mt-1 block text-14 text-white">
                Director, IIT Kharagpur, since June 2025
              </span>
              <span className="mt-4 block text-12 text-white">
                On the hospital&rsquo;s first surgery, 28 September 2025.{" "}
                <a
                  href={SOURCE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline"
                >
                  Source: ThePrint (PTI)
                </a>
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
