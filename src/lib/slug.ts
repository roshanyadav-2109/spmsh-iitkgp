/**
 * Lower case, hyphenated, ASCII only. Stable enough to live in a URL.
 *
 * Lives here rather than beside the actions that use it: a "use server" file
 * may only export async server actions, so a plain helper cannot sit in one.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
