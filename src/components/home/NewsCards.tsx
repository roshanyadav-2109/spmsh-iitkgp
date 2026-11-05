import Link from "next/link";
import { GoText, SectionHead } from "@/components/ui/Go";
import { formatDate } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";

export type HomeNotice = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  publishedAt: string | null;
};

/** The latest notices as three cards: date, title, and the read link. */
export async function NewsCards({ notices }: { notices: HomeNotice[] }) {
  const t = await getT();
  return (
    <section aria-labelledby="news" className="py-10 lg:py-12">
      <div className="page-width">
        <SectionHead
          id="news"
          title={t.home.news}
          link={{ href: "/announcements", label: t.home.allNotices }}
        />
        <ul className="mt-6 grid gap-4 md:grid-cols-3 lg:gap-5">
          {notices.slice(0, 3).map((notice) => (
            <li key={notice.id}>
              <Link
                href={`/announcements/${notice.slug}`}
                className="group ui-transition flex h-full min-h-44 flex-col rounded-lg border-2 border-tint bg-tint p-6 no-underline hover:border-ink hover:bg-white"
              >
                <span className="tnum text-13 text-faint">
                  {notice.publishedAt
                    ? formatDate(notice.publishedAt.slice(0, 10))
                    : ""}
                  {notice.category ? ` · ${notice.category}` : ""}
                </span>
                <span className="mt-3 line-clamp-3 text-16 font-medium leading-dense text-ink">
                  {notice.title}
                </span>
                <span className="mt-auto pt-6">
                  <GoText>{t.home.readNotice}</GoText>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
