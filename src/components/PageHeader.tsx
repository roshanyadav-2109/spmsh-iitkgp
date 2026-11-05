import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronIcon } from "@/components/ui/icons";

export type Crumb = { href: string; label: string };

/**
 * The head of every interior page: breadcrumb, the one h1, an optional single
 * line under it and optional actions.
 */
export function PageHeader({
  title,
  intro,
  crumbs,
  actions,
  icon,
}: {
  title: string;
  intro?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  /** A mark set before the title on a detail page, e.g. the department's icon. */
  icon?: ReactNode;
}) {
  const isSection = !crumbs || crumbs.length <= 1;

  const breadcrumb =
    crumbs && crumbs.length > 0 ? (
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1.5 text-13 text-muted">
          {crumbs.map((crumb) => (
            <li key={crumb.href} className="flex items-center gap-1.5">
              <Link
                href={crumb.href}
                className="text-muted no-underline hover:text-ink hover:underline"
              >
                {crumb.label}
              </Link>
              <ChevronIcon direction="right" className="text-muted" />
            </li>
          ))}
          {isSection ? (
            <li aria-current="page" className="text-ink">
              {title}
            </li>
          ) : null}
        </ol>
      </nav>
    ) : null;

  /*
   * A section page (one level below Home) needs no visible title: the menu
   * already names it. The h1 stays for screen readers and search engines.
   * A detail page keeps its title, because the title is the content: a
   * doctor's name, a department, a notice's headline. A section page's
   * actions are dropped too: the header already carries the booking button.
   */
  if (isSection) {
    return (
      <>
        <div className="pt-6 lg:pt-8">{breadcrumb}</div>
        <h1 className="sr-only">{title}</h1>
      </>
    );
  }

  return (
    <div className="bleed bg-white">
      <div className="page-width py-6 lg:py-8">
        {breadcrumb}

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex max-w-3xl items-start gap-5">
            {icon ? <div className="shrink-0">{icon}</div> : null}
            <div className="min-w-0">
              <h1 className="text-32 tracking-tightest lg:text-40 lg:tracking-display">
                {title}
              </h1>
              {intro ? (
                <div className="mt-3 max-w-2xl text-16 text-muted lg:text-18">
                  {intro}
                </div>
              ) : null}
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}
