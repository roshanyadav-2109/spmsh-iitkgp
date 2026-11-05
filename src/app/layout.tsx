import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { PalettePicker } from "@/components/site/PalettePicker";
import { DEFAULT_PALETTE, PALETTE_KEY } from "@/lib/palette";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { HTML_LANG } from "@/lib/i18n/locales";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name}, ${SITE.institute}`,
    template: `%s | ${SITE.shortName}, IIT Kharagpur`,
  },
  description:
    "Bookings, departments, doctors, services and site information for Dr. Syama Prasad Mookerjee Superspeciality Hospital, Indian Institute of Technology Kharagpur.",
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_IN",
    images: [
      {
        url: "/images/og-hospital.jpg",
        width: 1200,
        height: 630,
        alt: "The hospital building at Balarampur, beside the IIT Kharagpur campus",
      },
    ],
    title: `${SITE.name}, ${SITE.institute}`,
    description: "Bookings, departments, doctors, services and site information.",
  },
  formatDetection: { telephone: true, address: false, email: false },
};

/** The colour-review picker: on in development, or when the env flag is set. */
const SHOW_PALETTE_PICKER =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_PALETTE_PICKER === "1";

/**
 * Root layout carries the document and the design system only. The public site
 * and the staff portal each add their own chrome, so the portal does not sit
 * inside a patient-facing header.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={HTML_LANG[locale]} className="h-full" suppressHydrationWarning>
      <head>
        {SHOW_PALETTE_PICKER ? (
          <script
            // Applies the palette chosen in the review picker before first
            // paint, so a reload does not flash the default colours.
            dangerouslySetInnerHTML={{
              __html: `try{var p=localStorage.getItem("${PALETTE_KEY}");if(p&&p!=="${DEFAULT_PALETTE}")document.documentElement.dataset.palette=p}catch(e){}`,
            }}
          />
        ) : null}
        {/* Montserrat's latin file carries every weight above the fold; the
            latin-ext file is fetched on demand by unicode-range. */}
        <link
          rel="preload"
          href="/fonts/montserrat-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:border focus:border-navy focus:bg-white focus:px-3 focus:py-2 focus:text-14"
        >
          Skip to main content
        </a>
        <I18nProvider locale={locale}>{children}</I18nProvider>
        {SHOW_PALETTE_PICKER ? <PalettePicker /> : null}
      </body>
    </html>
  );
}
