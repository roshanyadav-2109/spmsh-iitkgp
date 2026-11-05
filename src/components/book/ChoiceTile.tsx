"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CheckIcon } from "@/components/ui/icons";

/**
 * A radio option drawn as a tappable card. The input stays in the DOM. The
 * chosen card takes a black edge, a light neutral fill and a tick disc; the
 * others only show their edge on hover.
 */
export function ChoiceTile({
  id,
  name,
  value,
  checked,
  onChange,
  className,
  hideIndicatorOnPhone = false,
  stacked = false,
  children,
}: {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  className?: string;
  /** Drop the corner tick below 640px, where narrow tiles need the room. */
  hideIndicatorOnPhone?: boolean;
  /** Icon on top and text below, with the tick in the corner: for narrow tiles. */
  stacked?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "ui-transition relative flex h-full cursor-pointer rounded-lg border-2 p-3 sm:p-4",
        stacked ? "flex-col items-start gap-2 pr-10" : "items-start gap-3",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
        checked
          ? "border-ink bg-tint-neutral"
          : "border-line bg-white hover:border-ink",
        className,
      )}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {children}
      <span
        aria-hidden="true"
        className={cn(
          "h-6 w-6 shrink-0 items-center justify-center rounded-full",
          stacked ? "absolute right-3 top-3" : "ml-auto",
          hideIndicatorOnPhone ? "hidden sm:flex" : "flex",
          checked ? "bg-ink text-white" : "border-2 border-line-strong bg-white",
        )}
      >
        {checked ? <CheckIcon size={16} /> : null}
      </span>
    </label>
  );
}
