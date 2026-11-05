import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

type FieldProps = {
  /** Explicit, so Field stays usable from server components. */
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  /** The marker set after an optional label, in the page language. */
  optionalLabel?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
};

/**
 * Every control gets a real <label>. A placeholder is never the label.
 * Most fields on this site are required, so the optional ones are the ones
 * that carry a marker.
 */
export function Field({
  id,
  label,
  hint,
  error,
  optional,
  optionalLabel = "(optional)",
  className,
  children,
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control: FieldControlProps = {
    id,
    ...(describedBy ? { "aria-describedby": describedBy } : {}),
    ...(error ? { "aria-invalid": true as const } : {}),
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-13 font-medium text-ink">
        {label}
        {optional ? (
          <span className="font-normal text-muted"> {optionalLabel}</span>
        ) : (
          <>
            <span aria-hidden="true" className="ml-0.5 text-emergency">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>

      {hint ? (
        <p id={hintId} className="text-13 text-muted">
          {hint}
        </p>
      ) : null}

      {children(control)}

      {error ? (
        <p id={errorId} className="text-13 text-emergency">
          {error}
        </p>
      ) : null}
    </div>
  );
}
