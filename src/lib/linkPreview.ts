/**
 * The publisher's own link preview for an article: the title, summary and
 * picture its page declares in Open Graph tags, the same card a chat app or
 * social network shows when the link is shared. Nothing here is written by
 * the hospital. Fetched on the server and cached for a day; returns null if
 * the page cannot be read, and the caller falls back to the stored headline.
 */
export type LinkPreview = {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

const decode = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

function meta(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const escaped = key.replace(/[:.]/g, "\\$&");
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']+)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${escaped}["']`,
        "i",
      ),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decode(match[1]);
    }
  }
  return null;
}

export async function getLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; SPMSH-LinkPreview/1.0)",
        accept: "text/html",
      },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 86400 },
    });
    if (!response.ok) return null;
    const html = (await response.text()).slice(0, 300_000);
    const image = meta(html, ["og:image:secure_url", "og:image", "twitter:image"]);
    return {
      title: meta(html, ["og:title", "twitter:title"]),
      description: meta(html, ["og:description", "twitter:description", "description"]),
      image: image && image.startsWith("https://") ? image : null,
      siteName: meta(html, ["og:site_name"]),
    };
  } catch {
    return null;
  }
}
