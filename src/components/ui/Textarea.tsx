import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";
import { CONTROL_BASE, CONTROL_TEXT } from "./Input";

type TextareaProps = ComponentPropsWithRef<"textarea">;

export function Textarea({ className, rows = 3, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        CONTROL_BASE,
        "min-h-16 px-3 py-2 leading-body",
        CONTROL_TEXT,
        className,
      )}
      {...props}
    />
  );
}
