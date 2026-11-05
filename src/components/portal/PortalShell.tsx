import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";
import type { StaffProfile } from "@/lib/auth";
import { PortalNav, type PortalNavItem } from "./PortalNav";
import { SignOutButton } from "./SignOutButton";

export type { PortalNavItem };

const ROLE_LABEL: Record<string, string> = {
  tech: "Admin",
  reception: "Reception",
  doctor: "Doctor",
};

/**
 * Portal chrome: a working app shell, not the public header. A fixed left
 * sidebar holds the identity, the one primary action, the sections and the
 * signed-in person; the content fills the rest of the screen. On phones the
 * sidebar folds into a top bar with the sections in one scrolling row.
 */
export function PortalShell({
  staff,
  nav,
  primaryAction,
  children,
}: {
  staff: StaffProfile;
  nav: PortalNavItem[];
  primaryAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  const role = ROLE_LABEL[staff.role] ?? staff.role;

  return (
    <div className="flex min-h-screen flex-col bg-tint-neutral lg:flex-row">
      <aside
        data-print="hide"
        className="border-b border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r"
      >
        <div className="flex items-center gap-3 px-5 py-4 lg:py-6">
          <Image
            src="/images/crest.png"
            alt=""
            width={302}
            height={228}
            sizes="40px"
            className="h-9 w-auto"
          />
          <div className="min-w-0">
            <p className="truncate text-15 font-semibold text-ink">
              {SITE.shortName} staff
            </p>
            <p className="text-13 text-muted">{role}</p>
          </div>
        </div>

        {primaryAction ? (
          <div className="hidden px-4 pb-4 lg:block [&_a]:w-full">{primaryAction}</div>
        ) : null}

        <PortalNav items={nav} />

        <div className="mt-auto hidden border-t border-line px-5 py-4 lg:block">
          <p className="truncate text-14 font-medium text-ink">{staff.fullName}</p>
          <p className="truncate text-13 text-muted">{staff.email}</p>
          <div className="mt-3 flex items-center gap-4 text-14">
            <Link href="/" className="text-ink no-underline hover:underline">
              Public site
            </Link>
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* The portal stays at 15px: dense working software read all day. */}
      <main id="main" className="min-w-0 flex-1 text-15">
        {/* Phone bar: the person and the exits, since the sidebar footer is hidden. */}
        <div
          data-print="hide"
          className="flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-2.5 text-13 lg:hidden"
        >
          <span className="truncate text-ink">{staff.fullName}</span>
          <span className="flex shrink-0 items-center gap-4">
            <Link href="/" className="text-ink no-underline">
              Public site
            </Link>
            <SignOutButton />
          </span>
        </div>
        {primaryAction ? (
          <div data-print="hide" className="px-5 pt-4 lg:hidden [&_a]:w-full">
            {primaryAction}
          </div>
        ) : null}
        <div className="portal-content">{children}</div>
      </main>
    </div>
  );
}
