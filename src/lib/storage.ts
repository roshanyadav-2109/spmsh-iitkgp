/** Public URL for an object in one of the two published buckets. */
export function storageUrl(
  bucket: "doctor-photos" | "announcement-files",
  path: string | null | undefined,
): string | null {
  if (!path) return null;
  /* Already a link. Doctor photographs are stored as URLs to wherever the
     picture already lives, not as uploads, so most values arriving here are
     absolute. Prefixing one produced
     ".../object/public/doctor-photos/https://..." — a 404 that still
     contained the original URL, so it looked right in the markup and was
     blank on the page. Anything with a scheme is passed straight through. */
  if (/^https?:\/\//i.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
