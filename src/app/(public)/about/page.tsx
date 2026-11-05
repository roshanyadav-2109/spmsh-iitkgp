import type { Metadata } from "next";
import { HOSPITAL_MILESTONES } from "@/lib/site";
import Image from "next/image";
import Link from "next/link";
import { DirectorBand } from "@/components/home/DirectorBand";
import { PageHeader } from "@/components/PageHeader";
import { ArrowDisc } from "@/components/ui/Go";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About the hospital",
  description:
    "Dr. Syama Prasad Mookerjee Superspeciality Hospital is established under SPMIMSRF, a Section 8 company owned by IIT Kharagpur. Scope, facilities and location.",
  alternates: { canonical: "/about" },
};

/** The hospital's own three commitments (spmsh.iitkgp.ac.in/about.php). */
const MISSION = [
  {
    title: "Care",
    text: "Accurate, cost-effective, high-quality healthcare with compassionate behaviour.",
  },
  { title: "Learning", text: "Academic and research excellence." },
  {
    title: "Trust",
    text: "A secure atmosphere during treatment, based on mutual trust, honesty and respect.",
  },
];

const SUPERSPECIALITIES = [
  { name: "Cardiothoracic surgery", icon: "cardiology" },
  { name: "Surgical gastroenterology", icon: "gastroenterology" },
  { name: "Respiratory medicine", icon: "radiology" },
  { name: "Neurosurgery", icon: "neurophysiology" },
  { name: "Transplantation", icon: "transplant" },
  { name: "Trauma", icon: "emergency" },
  { name: "Oncology", icon: "oncology" },
];

const LINKS = [
  { href: "/departments", label: "Departments", icon: "general-medicine" },
  { href: "/doctors", label: "Doctors", icon: "find-doctor" },
  { href: "/services", label: "Services", icon: "opd" },
  { href: "/administration", label: "Administration", icon: "check-booking" },
  { href: "/contact", label: "Contact and directions", icon: "directions" },
];

/**
 * Where the facts on this page come from (kept for checking, not shown):
 * - https://spmsh.iitkgp.ac.in/about.php
 * - https://www.iitkgpfoundation.org/article.html?aid=1541
 * - https://www.etvbharat.com/english/bharat/pm-modi-to-inaugurate-dr-syama-prasad-mookerjee-institute-at-iit-kharagpur/na20210223053050003
 * - https://news.careers360.com/iit-kharagpur-launch-first-md-programme-after-nmc-approval-mbbs-on-hold-clinical-training-at-spmsh-20-seats-inpatient-facilities
 * - https://www.linkedin.com/posts/suman-chakraborty-415ab3236_today-marks-a-truly-historic-milestone-for-activity-7377751503576526848-onVK/
 */

const HEADING = "text-26 tracking-tighter lg:text-32 lg:tracking-tightest";

export default function AboutPage() {
  return (
    <div className="pb-16 lg:pb-24">
      <div className="page-width">
        <PageHeader
          crumbs={[{ href: "/", label: "Home" }]}
          title="About the hospital"
        />
      </div>

      {/* Hero: the building, full width, with the opening statement beside it. */}
      <section aria-label="Overview" className="page-width mt-4">
        <div className="grid overflow-hidden rounded-lg bg-tint-neutral lg:grid-cols-2">
          <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
            <p className="text-14 font-medium text-ink">About the hospital</p>
            <h2 className="mt-3 text-32 tracking-tightest lg:text-40 lg:tracking-display">
              A superspeciality hospital of IIT Kharagpur
            </h2>
            <p className="mt-5 text-16 leading-[1.7] text-body lg:text-18">
              Owned by IIT Kharagpur and run through SPMIMSRF, a not-for-profit Section
              8 company. It stands at Balarampur, beside the IIT Kharagpur campus in
              Paschim Medinipur, West Bengal.
            </p>
            <p className="mt-4 text-16 leading-[1.7] text-body">
              One bed in ten is free; most others are charged at central and state
              health-scheme rates.
            </p>
          </div>
          <div className="relative aspect-[16/9] lg:mr-10 lg:self-center lg:overflow-hidden lg:rounded-lg">
            <Image
              src="/images/hospital-building.jpg"
              alt="The hospital building at Balarampur on the IIT Kharagpur campus"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <div className="page-width">
        <DirectorBand inset />
      </div>

      <section aria-labelledby="mission" className="page-width mt-16 lg:mt-20">
        <h2 id="mission" className={HEADING}>
          Our Mission
        </h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {MISSION.map((item, index) => (
            <li key={item.title} className="rounded-lg bg-tint-neutral p-6 lg:p-8">
              <span aria-hidden="true" className="tnum text-15 font-medium text-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-sans text-21 font-medium tracking-tight text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-16 leading-[1.6] text-body">{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Milestones as a horizontal timeline on desktop, a list on phones. */}
      <section aria-labelledby="milestones" className="page-width mt-16 lg:mt-20">
        <h2 id="milestones" className={HEADING}>
          Milestones
        </h2>
        <ol className="mt-10 grid gap-8 lg:grid-cols-5 lg:gap-6">
          {HOSPITAL_MILESTONES.map((item) => (
            <li key={item.year} className="relative border-t-2 border-ink pt-5">
              <span
                aria-hidden="true"
                className="absolute -top-[7px] left-0 h-3 w-3 rounded-full bg-ink"
              />
              <span className="tnum block text-26 font-medium tracking-tight text-ink">
                {item.year}
              </span>
              <span className="mt-2 block text-15 leading-[1.6] text-body">
                {item.detail}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="scope" className="page-width mt-16 lg:mt-20">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h2 id="scope" className={HEADING}>
            Superspecialities Planned
          </h2>
          <Link
            href="/departments"
            className="inline-flex items-center gap-2 text-15 font-medium text-ink no-underline hover:underline"
          >
            Departments running clinics now
            <ArrowDisc size="sm" />
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {SUPERSPECIALITIES.map(({ name, icon }) => (
            <li
              key={name}
              className="flex flex-col items-center rounded-lg border border-dashed border-muted px-3 py-6 text-center"
            >
              <Image
                src={`/icons/line/${icon}.png`}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14"
              />
              <span className="mt-4 text-15 font-medium leading-dense text-ink">
                {name}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-labelledby="explore" className="page-width mt-16 lg:mt-20">
        <h2 id="explore" className={HEADING}>
          Explore the Hospital
        </h2>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group ui-transition flex h-full flex-col items-start rounded-lg border border-line p-5 no-underline hover:border-ink"
              >
                <Image
                  src={`/icons/line/${item.icon}.png`}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12"
                />
                <span className="mt-4 flex w-full items-center justify-between gap-2 text-16 font-medium text-ink">
                  {item.label}
                  <ArrowDisc size="sm" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* The campus skyline, standing on the footer's top edge. Decorative. */}
      <div aria-hidden="true" className="-mb-16 mt-16 w-full lg:-mb-24 lg:mt-20">
        <Image
          src="/images/campus-panorama.webp"
          alt=""
          width={1600}
          height={536}
          sizes="100vw"
          className="block h-auto w-full"
        />
      </div>
    </div>
  );
}
