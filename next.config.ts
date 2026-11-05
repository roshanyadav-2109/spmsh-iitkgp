import type { NextConfig } from "next";

/**
 * Content Security Policy.
 *
 * `unsafe-eval` is never allowed in production. Next's development server
 * requires it, so development gets a policy identical apart from that one
 * directive.
 *
 * `unsafe-inline` remains on script-src for now because the App Router emits
 * inline bootstrap scripts. Phase 8 replaces it with a per-request nonce set
 * in middleware.
 */
const isProduction = process.env.NODE_ENV === "production";

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseSocket = supabaseOrigin.replace("https://", "wss://");

const csp = [
  "default-src 'self'",
  /* platform.twitter.com: X's embed script, on /newsroom only. */
  `script-src 'self' 'unsafe-inline' https://platform.twitter.com${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  /* The embedded X post loads its avatar and media from X's image host. */
  "img-src 'self' data: blob: https://pbs.twimg.com https://abs.twimg.com",
  "font-src 'self'",
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin} ${supabaseSocket}` : ""}`,
  /* The location map on /contact, and nothing else. It was 'none', which
     silently blocked the embed rather than failing loudly. Narrow to the one
     origin Google serves map embeds from: a wildcard here would let any
     framed content onto the site. */
  /* Plus the two post embeds on /newsroom: X's and LinkedIn's frames. */
  "frame-src https://www.google.com https://platform.twitter.com https://syndication.twitter.com https://www.linkedin.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const supabaseHost = supabaseOrigin ? new URL(supabaseOrigin).hostname : undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // Doctor photographs and announcement attachments only.
    /* Doctor photographs are LINKS, not uploads: a consultant's picture is
       pasted into the doctors screen as a URL and the file stays wherever it
       already lives. So the optimizer has to accept any https host.

       THE TRADE, stated plainly. `hostname: "**"` turns /_next/image into an
       open image proxy: anything that can put a URL in photo_path can make
       this server fetch it. Two things hold that in: the field is only
       writable from the authenticated reception and admin screens, and http
       is not allowed, so a link cannot be downgraded. If photographs ever move
       to the doctor-photos bucket, narrow this back to supabaseHost — the
       pattern for it is kept below. */
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
  // Pin the workspace root; an unrelated lockfile higher up the tree would
  // otherwise be inferred as the root and break output file tracing.
  outputFileTracingRoot: __dirname,
  /* Browser-automation scratch output lands in .playwright-mcp inside the
     project, and the dev server watches the project. Every click writes a
     console line, the write triggers Fast Refresh, the refresh produces more
     console lines — a rebuild loop that leaves the page stuck mid-submit and
     looks exactly like a hung server action. Nothing in there is source. */
  /* The default ignore list is a RegExp, and webpack refuses a list that mixes
     one with glob strings, so the defaults are restated here as globs rather
     than appended to. */
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/.git/**",
        "**/node_modules/**",
        "**/.next/**",
        "**/.playwright-mcp/**",
      ],
    };
    return config;
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
