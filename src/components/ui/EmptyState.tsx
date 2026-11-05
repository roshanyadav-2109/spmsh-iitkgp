import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { StateImage, type StateName } from "@/components/ui/StateImage";

/**
 * States what is not there and what to do next, with an optional picture
 * from public/images/states so the message is understood before it is read.
 */
export function EmptyState({
  title,
  description,
  action,
  image,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  image?: StateName;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-lg bg-tint px-6 py-8 sm:flex-row sm:items-center sm:gap-8",
        className,
      )}
    >
      {image ? <StateImage name={image} className="w-48 shrink-0 sm:w-56" /> : null}
      <div className="min-w-0">
        <p className="text-18 font-medium text-ink">{title}</p>
        {description ? (
          <p className="mt-2 max-w-prose text-15 text-body">{description}</p>
        ) : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
