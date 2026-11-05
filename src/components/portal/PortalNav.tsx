"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export type PortalNavItem = { href: string; label: string; exact?: boolean };

/** Sidebar sections: one 36px row each; the current one sits on a quiet surface step. */
export function PortalNav({ items }: { items: PortalNavItem[] }) {
  const pathname = usePathname();

  const isCurrent = (item: PortalNavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <nav
      aria-label="Portal"
      className="flex gap-1 overflow-x-auto px-3 pb-3 [scrollbar-width:none] lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0"
    >
      {items.map((item) => {
        const current = isCurrent(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex h-9 shrink-0 items-center whitespace-nowrap rounded-md px-3 text-14 no-underline transition-colors",
              current
                ? "bg-tint-neutral font-medium text-ink"
                : "text-body hover:bg-tint-neutral hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
