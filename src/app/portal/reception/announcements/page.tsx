import { AnnouncementManager } from "./AnnouncementManager";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireDesk } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AnnouncementsAdminPage() {
  await requireDesk();
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("announcements")
    .select("id, title, slug, body, category, is_pinned, is_published, published_at")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="page-width py-8">
      <h1 className="text-26 tracking-tighter">Announcements</h1>
      <p className="mt-3 max-w-prose text-15 text-muted">
        Markdown is supported. Raw HTML is stripped before a notice is shown, so paste
        plain text rather than formatted content from a word processor.
      </p>

      <div className="mt-8">
        <AnnouncementManager rows={data ?? []} />
      </div>
    </div>
  );
}
