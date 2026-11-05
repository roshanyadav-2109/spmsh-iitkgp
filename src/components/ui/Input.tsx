import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

/**
 * The control boundary. THIS IS A BUG FIX, NOT A PREFERENCE.
 *
 * The rest border used to be --color-line (#dbe2ec), which measures 1.23:1
 * on white, and hovered to --color-line-strong (#b8c4d4) at 1.48:1. WCAG
 * 1.4.11 requires 3:1 for the visual boundary of a control, so these inputs
 * had, in practice, no perceivable edge at all.
 *
 * Rest is now --color-muted #4a5568 = 5.33:1 on white. Hover and focus raise
 * it to the royal #0a2a5c = 15.79:1. Invalid is #c81e1e = 5.74:1, and it is
 * paired with aria-invalid, so the state is never carried by colour alone.
 *
 * The border is additive to the focus ring, which is never removed.
 */
export const CONTROL_BASE =
  "ui-transition block w-full rounded-sm border border-muted bg-white text-ink hover:border-navy focus:border-navy aria-[invalid=true]:border-emergency disabled:opacity-40 disabled:hover:border-muted";

type InputProps = ComponentPropsWithRef<"input">;

/**
 * 16px below 640px, 14px above.
 *
 * iOS Safari zooms the whole viewport whenever a focused input computes to
 * under 16px, and this layout is 100vw with `overflow-x: hidden`, so the user
 * is left scrolled sideways into content they cannot scroll back out of.
 * Desktop keeps the denser 14px.
 */
export const CONTROL_TEXT = "text-16 sm:text-14";

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(CONTROL_BASE, "h-11 px-3 sm:h-10", CONTROL_TEXT, className)}
      {...props}
    />
  );
}
