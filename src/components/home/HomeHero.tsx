import Image from "next/image";
import Link from "next/link";
import surgeryImage from "../../../public/images/first-surgery.jpg";
import { SearchIcon } from "@/components/ui/icons";
import { getT } from "@/lib/i18n/server";
import { isPlaceholder, type Settings } from "@/lib/settings";

/** Everyday words that the /doctors search already routes to a department. */
const PROBLEMS = [
  { q: "fever", label: "Fever" },
  { q: "eye", label: "Eyes" },
  { q: "teeth", label: "Teeth" },
  { q: "child", label: "Child" },
  { q: "pregnancy", label: "Pregnancy" },
  { q: "mental", label: "Mental health" },
];

const filled = (value: string | undefined) =>
  value && !isPlaceholder(value) ? value.trim() : null;

/**
 * The opening of the home page, set the way the large hospital sites open:
 * people on the left, a statement in large type on the right, the search bar
 * overlapping the foot of the picture.
 *
 * Nothing here is written in a person's name. When the hospital has supplied
 * a leader's photograph, name, title and approved message (hero_leader_* in
 * site_settings), they are shown. Until then the hero carries the words of the
 * hospital's namesake, verbatim and with their source: his address at
 * Scottish Church College, Kolkata, on 7 December 1935, as recorded on
 * Wikiquote (his entry, "Quotes" section). Keep the wording exact if it is ever
 * edited, and keep the source line under it.
 */
export async function HomeHero({ settings }: { settings: Settings }) {
  const t = await getT();
  const leader = {
    photo: filled(settings.hero_leader_photo),
    name: filled(settings.hero_leader_name),
    title: filled(settings.hero_leader_title),
    quote: filled(settings.hero_leader_quote),
  };
  const hasLeader = Boolean(leader.photo && leader.name && leader.quote);

  return (
    <>
      <section
        aria-labelledby="hero-title"
        className="relative overflow-hidden bg-white"
      >
        <div className="relative h-64 bg-tint sm:h-96 lg:absolute lg:inset-y-0 lg:-left-px lg:h-auto lg:w-[60%] lg:bg-transparent">
          {hasLeader && leader.photo ? (
            <Image
              src={leader.photo}
              alt={leader.name ?? ""}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-top"
            />
          ) : (
            <Image
              src={surgeryImage}
              alt="Surgeons operating in the hospital's theatre"
              fill
              priority
              placeholder="blur"
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-[40%_center]"
            />
          )}
          <div
            aria-hidden="true"
            className="hero-fade absolute inset-y-0 -right-1 left-0 hidden lg:block"
          />
        </div>

        <div className="page-width relative lg:flex lg:min-h-[520px] lg:items-center lg:justify-end">
          <div className="pb-6 pt-6 lg:w-[48%] lg:pb-28 lg:pt-10">
            <h1 id="hero-title" className="flex items-center gap-3">
              <Image
                src="/images/iitkgp-crest.png"
                alt=""
                width={327}
                height={369}
                sizes="32px"
                className="h-8 w-auto"
              />
              <span className="text-15 font-medium leading-dense text-ink">
                Dr. Syama Prasad Mookerjee Superspeciality Hospital
                <span className="block text-13 font-normal text-body">
                  {t.home.heroSub}
                </span>
              </span>
            </h1>

            <figure className="mt-7 lg:mt-9">
              <blockquote className="relative text-21 font-medium leading-[1.35] text-ink sm:text-26 lg:text-32 lg:leading-[1.25]">
                <span
                  aria-hidden="true"
                  className="absolute -left-1 -top-6 text-52 leading-none text-ink lg:-left-2 lg:-top-9"
                >
                  &ldquo;
                </span>
                <p className="relative">
                  {hasLeader ? (
                    leader.quote
                  ) : (
                    <>
                      Whatever work you undertake, do it{" "}
                      <span className="text-ink sm:text-ink">
                        seriously, thoroughly and well
                      </span>
                      ; never leave it half-done or undone, never feel yourself
                      satisfied unless and until you have given it your very best.
                    </>
                  )}
                </p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                {hasLeader ? (
                  <span aria-hidden="true" className="h-px w-8 bg-accent" />
                ) : (
                  <Image
                    src="/images/spm-portrait.jpg"
                    alt=""
                    width={240}
                    height={240}
                    sizes="48px"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                )}
                <span className="text-15 leading-dense">
                  <span className="block font-medium text-ink">
                    {hasLeader ? leader.name : "Dr. Syama Prasad Mookerjee"}
                  </span>
                  <span className="block text-14 text-body">
                    {hasLeader
                      ? leader.title
                      : "Speech at Scottish Church College, Kolkata, 7 December 1935"}
                  </span>
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <div className="page-width relative z-10 lg:-mt-16">
        <form
          action="/doctors"
          method="get"
          role="search"
          className="grid overflow-hidden rounded-lg border border-line bg-white sm:grid-cols-[minmax(0,1fr)_auto]"
        >
          <label htmlFor="hero-q" className="sr-only">
            {t.home.searchLabel}
          </label>
          <div className="flex items-center gap-3 px-4 sm:px-5">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-highlight text-white"
            >
              <SearchIcon size={16} />
            </span>
            <input
              id="hero-q"
              name="q"
              type="search"
              placeholder={t.home.searchPlaceholder}
              className="h-14 min-w-0 grow bg-transparent text-16 text-ink outline-offset-[-2px] lg:h-[72px]"
            />
          </div>
          <button
            type="submit"
            className="ui-transition h-12 bg-accent px-8 text-16 font-medium text-white hover:bg-accent-deep sm:h-auto"
          >
            {t.home.findDoctorBtn}
          </button>
        </form>

        <ul aria-label={t.home.commonProblems} className="mt-4 flex flex-wrap gap-2">
          {PROBLEMS.map((problem) => (
            <li key={problem.q}>
              <Link
                href={`/doctors?q=${problem.q}`}
                className="ui-transition inline-flex h-10 items-center rounded-full border border-ink bg-transparent px-4 text-15 text-ink no-underline hover:underline"
              >
                {t.home.problems[problem.q] ?? problem.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
