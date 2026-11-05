import Link from "next/link";
import { markFor } from "@/components/ui/departmentMark";
import { ChevronIcon } from "@/components/ui/icons";

export function DepartmentTile({
  name,
  slug,
  meta,
}: {
  name: string;
  slug: string;
  /** A short second line, e.g. "2 doctors". Falls back to the plain-words gloss. */
  meta?: string;
}) {
  const mark = markFor(name, 48);
  const gloss = mark.gloss.charAt(0).toUpperCase() + mark.gloss.slice(1);

  return (
    <Link
      href={`/departments/${slug}`}
      className="card ui-transition group flex h-full items-center gap-4 p-4 no-underline"
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center"
      >
        {mark.icon}
      </span>
      <span className="min-w-0 grow">
        <span className="block text-16 font-medium leading-dense text-ink group-hover:underline">
          {name}
        </span>
        <span className="mt-0.5 block text-13 text-muted">{meta ?? gloss}</span>
      </span>
      <ChevronIcon
        direction="right"
        className="shrink-0 text-muted group-hover:text-ink"
      />
    </Link>
  );
}
