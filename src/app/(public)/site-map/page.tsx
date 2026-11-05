import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/PolicyPage";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Site Map",
  description:
    "Every page on the website of Dr. Syama Prasad Mookerjee Superspeciality Hospital, IIT Kharagpur.",
  alternates: { canonical: "/site-map" },
};

/**
 * A site map a person can read, as against /sitemap.xml, which is for search
 * engines. The footer used to link the XML file under the words "Site map",
 * which handed anybody who clicked it a wall of markup.
 *
 * Departments and consultants are read from the database rather than listed
 * here, so a speciality added by the desk appears on this page without anyone
 * remembering to come and add it.
 */
export default async function SiteMapPage() {
  const supabase = createPublicClient();

  const [{ data: departments }, { data: doctors }] = await Promise.all([
    supabase.from("departments").select("name, slug").order("name"),
    supabase.from("doctors").select("full_name, slug").order("full_name"),
  ]);

  const sections = [
    {
      heading: "The hospital",
      links: [
        { href: "/", label: "Home" },
        { href: "/about", label: "About the hospital" },
        { href: "/administration", label: "Administration" },
        { href: "/announcements", label: "Announcements" },
        { href: "/newsroom", label: "Newsroom" },
        { href: "/contact", label: "Information and timings" },
        { href: "/emergency", label: "Emergency" },
      ],
    },
    {
      heading: "Care",
      links: [
        { href: "/departments", label: "Departments" },
        { href: "/doctors", label: "Doctors" },
        { href: "/services", label: "Services and facilities" },
      ],
    },
    {
      heading: "Appointments",
      links: [
        { href: "/book", label: "Request an appointment" },
        { href: "/appointment/status", label: "Check a booking" },
      ],
    },
    {
      heading: "Departments",
      links: (departments ?? []).map((d) => ({
        href: `/departments/${d.slug}`,
        label: d.name,
      })),
    },
    {
      heading: "Consultants",
      links: (doctors ?? []).map((d) => ({
        href: `/doctors/${d.slug}`,
        label: d.full_name,
      })),
    },
    {
      heading: "Policies",
      links: [
        { href: "/terms", label: "Terms & Conditions" },
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/privacy-practices", label: "Notice of Privacy Practices" },
        { href: "/nondiscrimination", label: "Notice of Nondiscrimination" },
        { href: "/accessibility", label: "Digital Accessibility Statement" },
        { href: "/advertising-policy", label: "Advertising & Sponsorship Policy" },
        { href: "/cookies", label: "Manage Cookies" },
      ],
    },
    {
      heading: "Staff",
      links: [{ href: "/login", label: "Staff login" }],
    },
  ].filter((section) => section.links.length > 0);

  return (
    <PolicyPage title="Site Map" intro="Every page on this website.">
      <div className="grid gap-12">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-21 tracking-tight">{section.heading}</h2>
            <ul className="mt-4 grid gap-2 text-18 sm:grid-cols-2">
              {section.links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PolicyPage>
  );
}
