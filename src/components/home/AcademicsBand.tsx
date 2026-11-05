import Image from "next/image";
import { GoLink, SectionHead } from "@/components/ui/Go";
import type { ResearchPaper } from "@/lib/departmentInfo";
import { getT } from "@/lib/i18n/server";

/**
 * The hospital as a medical school: the postgraduate programme on the left,
 * the newest IIT Kharagpur papers on the right. Every line is either a
 * published figure or a citation checked against Crossref.
 */
export async function AcademicsBand({ papers }: { papers: ResearchPaper[] }) {
  const t = await getT();
  return (
    <section aria-labelledby="academics" className="py-10 lg:py-12">
      <div className="page-width">
        <SectionHead id="academics" title={t.home.academics} />
        <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-5">
          <div className="flex flex-col overflow-hidden rounded-lg bg-panel">
            <div className="relative aspect-[16/9]">
              <Image
                src="/images/hospital-building.jpg"
                alt="The hospital building at Balarampur"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="flex grow flex-col items-start gap-5 p-6 lg:p-8">
              <div>
                <h3 className="text-21 text-ink">{t.home.pgTitle}</h3>
                <p className="mt-2 text-16 text-body">{t.home.pgBody}</p>
              </div>
              <GoLink href="/about" className="mt-auto">
                {t.home.aboutHospital}
              </GoLink>
            </div>
          </div>

          {papers.length > 0 ? (
            <div className="rounded-lg bg-panel p-6 lg:p-8">
              <h3 className="text-21 text-ink">{t.home.research}</h3>
              <ul className="mt-5 grid gap-3">
                {papers.map((paper) => (
                  <li key={paper.doi} className="rounded-md bg-white p-4 lg:p-5">
                    <a
                      href={`https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-16 font-medium leading-dense text-ink no-underline hover:text-ink hover:underline"
                    >
                      {paper.title}
                    </a>
                    <p className="mt-2 text-14 text-body">
                      {paper.authors} &middot; {paper.journal} &middot;{" "}
                      <span className="tnum">{paper.year}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
