import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ChipVariant = "filled" | "outline";

/**
 * Status is carried by the label plus the weight of the chip. There is no
 * red, green or amber anywhere in this system, so a chip prints legibly in
 * black and white and reads correctly for colourblind users by construction.
 */
export function Chip({
  variant = "outline",
  className,
  children,
}: {
  variant?: ChipVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-12 whitespace-nowrap",
        /* Chips sit on white and on the tint, both light grounds. The filled
           chip stays on the royal — white on it is 15.79:1 — and the outline
           chip's border moves to muted, 5.33:1, so the boundary is actually
           visible where #dbe2ec at 1.23:1 was not. */
        variant === "filled" ? "bg-navy text-white" : "border border-muted text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
