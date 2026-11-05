import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Chip } from "@/components/ui/Chip";
import { DownloadIcon } from "@/components/ui/icons";
import { createPublicClient } from "@/lib/supabase/public";
import { excerpt, renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/dates";
import { storageUrl } from "@/lib/storage";

export const revalidate = 120;

type Props = { params: Promise<{ slug: string }> };

async function getAnnouncement(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("announcements")
    .select("id, title, slug, body, category, is_pinned, published_at, attachment_path")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const announcement = await getAnnouncement(slug);
  if (!announcement) return { title: "Announcement not found" };
  return {
    title: announcement.title,
    description: excerpt(announcement.body, 160),
    alternates: { canonical: `/announcements/${announcement.slug}` },
    openGraph: {
      type: "article",
      title: announcement.title,
      description: excerpt(announcement.body, 160),
      publishedTime: announcement.published_at ?? undefined,
    },
  };
}

export default async function AnnouncementPage({ params }: Props) {
  const { slug } = await params;
  const announcement = await getAnnouncement(slug);
  if (!announcement) notFound();

  const html = await renderMarkdown(announcement.body);
  const attachment = storageUrl("announcement-files", announcement.attachment_path);

  return (
    <div className="page-width pb-16 lg:pb-24">
      <PageHeader
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/announcements", label: "Notices" },
        ]}
        title={announcement.title}
        intro={
          announcement.published_at
            ? `Published ${formatDate(announcement.published_at.slice(0, 10))}`
            : undefined
        }
      />

      {announcement.category || announcement.is_pinned ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {announcement.category ? <Chip>{announcement.category}</Chip> : null}
          {announcement.is_pinned ? <Chip variant="filled">Pinned</Chip> : null}
        </div>
      ) : null}

      {/* Sanitised on the server. */}
      <article className="prose mt-8" dangerouslySetInnerHTML={{ __html: html }} />

      {attachment ? (
        <a
          href={attachment}
          className="card ui-transition mt-8 inline-flex items-center gap-2 px-4 py-3 text-15 text-ink no-underline"
          download
        >
          <DownloadIcon />
          Download attachment
        </a>
      ) : null}

      <p className="mt-12 text-15">
        <Link href="/announcements" className="text-ink">
          All notices
        </Link>
      </p>
    </div>
  );
}
