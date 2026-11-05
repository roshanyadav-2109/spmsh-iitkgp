import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  "primary" | "secondary" | "quiet" | "onDark" | "onDarkOutline";
export type ButtonSize = "md" | "sm";

/**
 * Primary  — accent fill, white label. One per screen region.
 * Secondary— white fill, muted border. The default for most actions.
 * Quiet    — no border until hover. For low-weight, repeated row actions.
 *
 * DISABLED IS A SKIN, NOT AN OPACITY. THIS IS A BUG FIX.
 *
 * A disabled primary used to keep the full #0F5BD6 fill and its white label at
 * opacity 0.4. That composites to roughly 2.1:1 — unreadable — while still
 * looking exactly like a live button, so a patient on /book tapped "Choose a
 * date" three times before working out that a doctor had to be picked first.
 * A disabled control now takes a real disabled skin: white fill, #6b7280
 * border (3.45:1 against white, which is what WCAG 1.4.11 asks of a control
 * boundary) and a #4a5568 label at 5.33:1. It reads as unavailable and it
 * reads at all. Callers are expected to say WHY next to it; opacity never
 * could.
 *
 * The primary fill moved off the old navy-hover (#1e9ce5): white on it is
 * 3.03:1, which fails AA for a 14px button label. Every ratio below is
 * against the fill the label actually sits on.
 */
const DISABLED =
  "disabled:border-placeholder disabled:bg-white disabled:text-muted disabled:hover:border-placeholder disabled:hover:bg-white disabled:hover:text-muted disabled:hover:opacity-100 " +
  "aria-disabled:border-placeholder aria-disabled:bg-white aria-disabled:text-muted aria-disabled:hover:border-placeholder aria-disabled:hover:bg-white aria-disabled:hover:text-muted";

const BASE =
  "ui-transition inline-flex items-center justify-center gap-2 rounded-md border font-medium whitespace-nowrap";

/**
 * 44px tall below 640px, which is the WCAG 2.5.5 target size, stepping down to
 * the denser 40px above it. The primary actions on /book and the doctors
 * filter measured 40px on a 390px phone, and "Apply filters" and "Choose a
 * date" took two goes with a shaky hand.
 */
const SIZES: Record<ButtonSize, string> = {
  md: "h-11 px-5 text-15",
  sm: "h-9 px-3.5 text-14",
};

const VARIANTS: Record<ButtonVariant, string> = {
  // White on #0f5bd6 = 6.02:1; hover white on #0a2a5c = 15.79:1.
  primary: "border-accent bg-accent text-white hover:border-navy hover:bg-navy",
  // #0f5bd6 on white 6.02:1, on the #f5f8fc hover 5.65:1. The border moved
  // from #dbe2ec (1.23:1) to #4a5568 (5.33:1), which is what WCAG 1.4.11
  // asks of a control boundary.
  secondary: "border-muted bg-white text-ink hover:border-ink",
  quiet: "border-transparent bg-transparent text-ink",
  // For the navy navigation bar and the portal strip: a white button on a
  // deep navy field. Hover moves opacity, not colour, because there is no
  // lighter white to move to. Navy on white = 15.79:1.
  onDark: "border-white bg-white text-ink hover:opacity-90",
  // The secondary action on a royal ground. White on the royal is 15.79:1
  // and white on #061b3d is 18.15:1. It deliberately does NOT hover to
  // #1e9ce5, where white would fall to 3.03:1.
  onDarkOutline: "border-white bg-transparent text-white hover:bg-brand-darker",
};

export function buttonClasses(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  className?: string,
): string {
  // DISABLED after VARIANTS, so a variant's own fill and hover never win over
  // the disabled skin.
  return cn(BASE, SIZES[size], VARIANTS[variant], DISABLED, className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

type ButtonLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export function ButtonLink({
  href,
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(buttonClasses(variant, size, className), "no-underline")}
      {...props}
    >
      {children}
    </Link>
  );
}
