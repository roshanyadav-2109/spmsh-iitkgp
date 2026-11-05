"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { CloseIcon } from "./icons";

/**
 * Native <dialog>, so focus trapping, Escape handling and inertness come from
 * the platform rather than from a library. The backdrop is navy at alpha —
 * a scrim, not a blur.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100vw-32px)] max-w-lg rounded-sm border border-navy bg-white p-0 text-ink backdrop:bg-scrim",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
        <div>
          <h2 id={titleId} className="text-21 tracking-tight">
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="mt-1 text-14 text-muted">
              {description}
            </p>
          ) : null}
        </div>
        <Button
          variant="quiet"
          size="sm"
          onClick={onClose}
          aria-label="Close"
          className="-mr-2 shrink-0"
        >
          <CloseIcon />
        </Button>
      </div>

      <div className="px-6 py-4 text-15">{children}</div>

      {footer ? (
        <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}
