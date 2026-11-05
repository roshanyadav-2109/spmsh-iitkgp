import { cn } from "@/lib/cn";

/**
 * A fact this build was not given. Renders the literal PROVIDE token, boxed
 * so it is impossible to mistake for real content on a page or in a
 * screenshot. Every occurrence is collected into /CONTENT-TODO.md by
 * `npm run content:todo`.
 *
 * Nothing about this hospital is invented. If a number, timing or name is
 * unknown, it appears here instead.
 */
export function Provide({
  note,
  tone = "onLight",
  className,
}: {
  note: string;
  /** `onDark` for the navy header strip and footer. */
  tone?: "onLight" | "onDark";
  className?: string;
}) {
  return (
    <span
      data-provide={note}
      className={cn(
        "inline-block max-w-full rounded-sm border px-1.5 py-0.5 text-13 [overflow-wrap:anywhere]",
        tone === "onDark" ? "border-white text-white" : "border-navy text-ink",
        className,
      )}
    >
      [[PROVIDE: {note}]]
    </span>
  );
}
