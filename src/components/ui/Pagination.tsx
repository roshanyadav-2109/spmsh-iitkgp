import Link from "next/link";
import { cn } from "@/lib/cn";
import { buttonClasses } from "./Button";

/**
 * Server-rendered links, so paginated public lists stay crawlable and work
 * without JavaScript.
 */
export function Pagination({
  page,
  totalPages,
  hrefFor,
  className,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const window = 2;
  const first = Math.max(1, page - window);
  const last = Math.min(totalPages, page + window);
  const pages: number[] = [];
  for (let n = first; n <= last; n += 1) pages.push(n);

  const disabled = "pointer-events-none opacity-40";

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      <Link
        href={hrefFor(page - 1)}
        aria-disabled={page === 1 || undefined}
        tabIndex={page === 1 ? -1 : undefined}
        className={cn(
          buttonClasses("secondary", "sm"),
          "no-underline",
          page === 1 && disabled,
        )}
      >
        Previous
      </Link>

      {first > 1 ? <span className="px-1 text-13 text-muted">…</span> : null}

      {pages.map((n) => (
        <Link
          key={n}
          href={hrefFor(n)}
          aria-current={n === page ? "page" : undefined}
          className={cn(
            buttonClasses(n === page ? "primary" : "quiet", "sm"),
            "tnum no-underline",
          )}
        >
          {n}
        </Link>
      ))}

      {last < totalPages ? <span className="px-1 text-13 text-muted">…</span> : null}

      <Link
        href={hrefFor(page + 1)}
        aria-disabled={page === totalPages || undefined}
        tabIndex={page === totalPages ? -1 : undefined}
        className={cn(
          buttonClasses("secondary", "sm"),
          "no-underline",
          page === totalPages && disabled,
        )}
      >
        Next
      </Link>

      <p className="ml-2 text-13 text-muted tnum">
        Page {page} of {totalPages}
      </p>
    </nav>
  );
}
