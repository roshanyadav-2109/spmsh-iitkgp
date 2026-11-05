import type { Metadata } from "next";
import Link from "next/link";
import { OutletLogo } from "@/components/OutletLogo";
import { PageHeader } from "@/components/PageHeader";
import { PressRow } from "@/components/PressRow";
import { SocialEmbed } from "@/components/SocialEmbed";
import { PRESS, PRESS_OUTLETS, SOCIAL_POSTS } from "@/lib/press";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Newsroom",
  description:
    "News coverage of Dr. Syama Prasad Mookerjee Superspeciality Hospital, IIT Kharagpur, and posts from IIT Kharagpur.",
  alternates: { canonical: "/newsroom" },
};

export default function NewsroomPage() {
  /* The first article from each paper, for its logo tile. */
  const firstFrom = (outlet: string) => PRESS.find((item) => item.outlet === outlet);

  return (
    <div className="page-width pb-16 lg:pb-24">
      <PageHeader crumbs={[{ href: "/", label: "Home" }]} title="Newsroom" />

      <section aria-labelledby="featured-in" className="mt-6">
        <h2 id="featured-in" className="text-15 font-medium text-body">
          Featured in
        </h2>
        <ul className="mt-4 flex flex-wrap items-center gap-x-10 gap-y-6">
          {PRESS_OUTLETS.map((outlet) => (
            <li key={outlet}>
              <a
                href={firstFrom(outlet)?.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${outlet} (opens in a new tab)`}
                className="ui-transition flex h-12 items-center opacity-90 hover:opacity-100"
              >
                <OutletLogo outlet={outlet} className="h-6 max-w-40" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-10">
        <section
          aria-labelledby="articles"
          className="min-w-0 lg:col-span-7 xl:col-span-8"
        >
          <h2 id="articles" className="text-26 tracking-tighter">
            Articles
          </h2>
          <ul className="mt-4 grid divide-y divide-line">
            {PRESS.map((item) => (
              <li key={item.href}>
                <PressRow item={item} />
              </li>
            ))}
          </ul>
        </section>

        {SOCIAL_POSTS.length > 0 ? (
          <aside
            aria-labelledby="posts"
            className="min-w-0 lg:col-span-5 xl:col-span-4"
          >
            <h2 id="posts" className="text-26 tracking-tighter">
              From IIT Kharagpur
            </h2>
            <ul className="mt-5 grid gap-6">
              {SOCIAL_POSTS.map((post) => (
                <li
                  key={post.platform === "x" ? post.url : post.urn}
                  className="min-w-0"
                >
                  <SocialEmbed post={post} />
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>

      <p className="mt-14 text-15 text-body">
        Hospital notices, such as timings and holidays, are on the{" "}
        <Link href="/announcements" className="text-ink">
          Notices
        </Link>{" "}
        page.
      </p>
    </div>
  );
}
