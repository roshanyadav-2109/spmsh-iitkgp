import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = SITE.url.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The portal and anything that can echo a booking back are kept out of
        // search indexes.
        disallow: ["/portal/", "/login", "/appointment/status", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
