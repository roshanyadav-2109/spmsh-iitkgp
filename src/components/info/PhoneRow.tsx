import { Provide } from "@/components/Provide";
import { PhoneIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { isPlaceholder, placeholderNote } from "@/lib/settings";

export function telHref(value: string): string {
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}

/** A full-width, tappable telephone row: label on the left, number on the right. */
export function PhoneRow({
  label,
  value,
  urgent = false,
  fallbackNote,
}: {
  label: string;
  value: string | undefined;
  urgent?: boolean;
  fallbackNote?: string;
}) {
  const body = (
    <>
      <span className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-sm",
            urgent ? "bg-emergency text-white" : "bg-panel text-ink",
          )}
        >
          <PhoneIcon size={18} />
        </span>
        <span
          className={cn("text-16", urgent ? "font-medium text-emergency" : "text-ink")}
        >
          {label}
        </span>
      </span>
      {isPlaceholder(value) ? (
        <Provide note={fallbackNote ?? placeholderNote(value)} />
      ) : (
        <span
          className={cn(
            "tnum text-18 tracking-tight sm:text-21",
            urgent ? "font-medium text-emergency" : "font-medium text-ink",
          )}
        >
          {value}
        </span>
      )}
    </>
  );

  const rowClass =
    "flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-5";

  if (isPlaceholder(value)) {
    return <div className={rowClass}>{body}</div>;
  }
  return (
    <a
      href={telHref(value ?? "")}
      className={cn(rowClass, "ui-transition no-underline")}
    >
      {body}
    </a>
  );
}
