import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowUpRightIcon } from "@/components/ui/icons";

/** The accent disc with an up-right arrow: the site's one "go" mark. */
export function ArrowDisc({
  size = "md",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full bg-highlight text-white",
        size === "sm" ? "h-6 w-6" : "h-9 w-9",
        className,
      )}
    >
      <ArrowUpRightIcon size={size === "sm" ? 16 : 18} />
    </span>
  );
}

/** Outlined link with the arrow disc: "View all departments", "Know more". */
export function GoLink({
  href,
  children,
  className,
  tone = "light",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  /** "dark" for a link sitting on a deep band. */
  tone?: "light" | "dark";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "ui-transition inline-flex h-12 shrink-0 items-center gap-3 rounded-md border pl-5 pr-3 text-15 font-medium no-underline",
        tone === "dark"
          ? "border-white/60 bg-transparent text-white hover:bg-white/10"
          : "border-accent bg-white text-ink",
        className,
      )}
    >
      {children}
      <ArrowDisc size="sm" />
    </Link>
  );
}

/** Inline "Read more" with the small disc, for the foot of a card. */
export function GoText({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-15 font-medium text-ink">
      {children}
      <ArrowDisc size="sm" />
    </span>
  );
}

/**
 * Every home section opens the same way: the title on the left and the
 * "view all" link on the right.
 */
export function SectionHead({
  id,
  title,
  link,
  className,
  tone = "light",
}: {
  id: string;
  title: ReactNode;
  link?: { href: string; label: string };
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-12 gap-y-4",
        className,
      )}
    >
      <h2
        id={id}
        className={cn(
          "text-26 leading-[1.15] sm:text-32 lg:text-40",
          tone === "dark" ? "text-white" : "text-ink",
        )}
      >
        {title}
      </h2>
      {link ? (
        <GoLink href={link.href} tone={tone}>
          {link.label}
        </GoLink>
      ) : null}
    </div>
  );
}
