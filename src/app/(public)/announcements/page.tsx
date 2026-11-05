import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { createPublicClient } from "@/lib/supabase/public";
import { formatDate } from "@/lib/dates";
import { excerpt } from "@/lib/markdown";

export const revalidate = 120;

const PAGE_SIZE = 10;

export const metadata: Metadata = {
  title: "Notices",
  description:
    "Notices, camps, closures and changes to OPD timings at Dr. Syama Prasad Mookerjee Superspeciality Hospital, IIT Kharagpur.",
  alternates: { canonical: "/announcements" },
};

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AnnouncementsPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const supabase = createPublicClient();
  const { data, count } = await supabase
    .from("announcements")
    .select("id, title, slug, body, category, is_pinned, published_at", {
      count: "exact",
    })
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="page-width pb-16 lg:pb-24">
      <PageHeader crumbs={[{ href: "/", label: "Home" }]} title="Notices" />

      <div className="mt-10">
        {(data ?? []).length === 0 ? (
          <EmptyState
            image="no-notices"
            title="No new notices"
            description="Notices about timings, holidays and new services will appear here."
          />
        ) : (
          <ul className="grid gap-3">
            {(data ?? []).map((announcement) => (
              <li key={announcement.id}>
                <Link
                  href={`/announcements/${announcement.slug}`}
                  className="card ui-transition group grid gap-2 p-5 no-underline sm:grid-cols-[8rem_1fr] sm:gap-6"
                >
                  <span className="tnum text-14 text-muted">
                    {announcement.published_at
                      ? formatDate(announcement.published_at.slice(0, 10))
                      : ""}
                  </span>
                  <span>
                    <span className="flex flex-wrap items-center gap-2">
                      {announcement.is_pinned ? (
                        <Chip variant="filled">Pinned</Chip>
                      ) : null}
                      {announcement.category ? (
                        <Chip>{announcement.category}</Chip>
                      ) : null}
                    </span>
                    <span className="mt-2 block font-display text-18 font-medium leading-dense text-ink group-hover:underline">
                      {announcement.title}
                    </span>
                    <span className="mt-1 block max-w-prose text-14 text-muted">
                      {excerpt(announcement.body)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Pagination
        className="mt-8"
        page={page}
        totalPages={totalPages}
        hrefFor={(n) => (n <= 1 ? "/announcements" : `/announcements?page=${n}`)}
      />
    </div>
  );
}
