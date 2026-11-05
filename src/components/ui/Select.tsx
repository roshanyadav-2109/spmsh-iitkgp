import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";
import { CONTROL_BASE, CONTROL_TEXT } from "./Input";
import { ChevronIcon } from "./icons";

type SelectProps = ComponentPropsWithRef<"select">;

/**
 * Native select, so the platform's own type-ahead works: at the counter an
 * operator types the first letters of a doctor's name and lands on it without
 * touching the mouse. The chevron is drawn rather than left to the OS so the
 * control matches Input everywhere.
 */
export function Select({ className, children, ...props }: SelectProps) {
  return (
    <span className={cn("relative block", className)}>
      <select
        /* 44px below 640px — the WCAG 2.5.5 target size — and the denser
           40px above it. */
        className={cn(
          CONTROL_BASE,
          "h-11 appearance-none pl-3 pr-9 sm:h-10",
          CONTROL_TEXT,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronIcon
        direction="down"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink"
      />
    </span>
  );
}
