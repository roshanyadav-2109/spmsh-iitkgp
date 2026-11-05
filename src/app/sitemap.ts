import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/$/, "");
  const supabase = createPublicClient();

  const [departments, doctors, announcements] = await Promise.all([
    supabase.from("departments").select("slug"),
    supabase.from("doctors").select("slug"),
    supabase.from("announcements").select("slug, published_at"),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/about` },
    { url: `${base}/administration` },
    { url: `${base}/departments` },
    { url: `${base}/doctors` },
    { url: `${base}/services` },
    { url: `${base}/announcements` },
    { url: `${base}/book`, priority: 0.9 },
    { url: `${base}/appointment/status` },
    { url: `${base}/contact` },
    { url: `${base}/emergency`, priority: 0.9 },
  ];

  return [
    ...staticRoutes,
    ...(departments.data ?? []).map((row) => ({
      url: `${base}/departments/${row.slug}`,
    })),
    ...(doctors.data ?? []).map((row) => ({ url: `${base}/doctors/${row.slug}` })),
    ...(announcements.data ?? []).map((row) => ({
      url: `${base}/announcements/${row.slug}`,
      lastModified: row.published_at ? new Date(row.published_at) : undefined,
    })),
  ];
}
