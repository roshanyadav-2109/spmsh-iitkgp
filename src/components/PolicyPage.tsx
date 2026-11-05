import type { ReactNode } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { getSettings } from "@/lib/settings";
import { realPhone, tel } from "@/lib/phone";

const POLICIES = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/privacy-practices", label: "Notice of Privacy Practices" },
  { href: "/nondiscrimination", label: "Notice of Nondiscrimination" },
  { href: "/advertising-policy", label: "Advertising Policy" },
  { href: "/cookies", label: "Manage Cookies" },
];

/** The frame the policy pages share: the text, and beside it help and the other policies. */
export async function PolicyPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  const settings = await getSettings();
  const opd = realPhone(settings.reception_phone);

  return (
    <div className="page-width pb-16 lg:pb-24">
      <PageHeader crumbs={[{ href: "/", label: "Home" }]} title={title} intro={intro} />
      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="min-w-0 lg:col-span-8">{children}</div>
        <aside className="grid content-start gap-4 lg:col-span-4">
          {opd ? (
            <div className="rounded-lg bg-tint p-5">
              <p className="text-16 font-medium text-ink">Questions about this page?</p>
              <p className="mt-1 text-15 text-body">
                Call the OPD counter on{" "}
                <a href={tel(opd)} className="tnum font-medium text-ink">
                  {opd}
                </a>
                .
              </p>
            </div>
          ) : null}
          <nav aria-label="Policies" className="rounded-lg bg-tint p-5">
            <p className="text-16 font-medium text-ink">Policies</p>
            <ul className="mt-2 grid gap-1.5 text-15">
              {POLICIES.map((policy) => (
                <li key={policy.href}>
                  <Link href={policy.href} className="text-ink">
                    {policy.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}

/** A section inside a policy page. */
export function PolicySection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-21 tracking-tight">{heading}</h2>
      <div className="mt-3 grid gap-3 text-16">{children}</div>
    </section>
  );
}

/** Marks a commitment only the hospital can make, pending its approval. */
export function PendingNote({ children }: { children: ReactNode }) {
  return <p className="mt-10 rounded-md bg-tint p-5 text-15">{children}</p>;
}
