import { extendTailwindMerge } from "tailwind-merge";

export type ClassValue = string | false | null | undefined;

/**
 * Joins class names and resolves conflicts.
 *
 * A plain join is not enough. Tailwind emits utilities in its own canonical
 * order, not in the order they appear in the attribute, so a component that
 * hard-codes `w-full` in its base classes wins over a caller's `w-56` no
 * matter which is written last. That silently broke every fixed-width filter
 * control on the site. tailwind-merge drops the losing class instead.
 *
 * The type scale is named by pixel value (text-12 ... text-52) rather than
 * Tailwind's t-shirt sizes, so those class groups are declared here or the
 * merger would not know that text-14 and text-16 conflict.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: ["12", "13", "14", "15", "16", "18", "21", "26", "32", "40", "52"],
        },
      ],
    },
  },
});

export function cn(...values: ClassValue[]): string {
  return twMerge(values.filter(Boolean).join(" "));
}
