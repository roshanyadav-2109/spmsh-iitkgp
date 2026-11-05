"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "./Button";

type Toast = {
  id: number;
  title: string;
  description?: string;
};

type ToastContextValue = {
  showToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Messages stay until they are dismissed. Nothing here auto-hides: a
 * confirmation the operator did not manage to read is worse than no
 * confirmation at all.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = nextId.current;
    nextId.current += 1;
    setToasts((current) => [...current, { ...toast, id }]);
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        data-print="hide"
        className="pointer-events-none fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2 sm:right-auto sm:max-w-sm"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start justify-between gap-4 rounded-sm border border-navy bg-white px-4 py-3"
          >
            <div>
              <p className="text-14 font-medium text-ink">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-13 text-muted">{toast.description}</p>
              ) : null}
            </div>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => dismissToast(toast.id)}
              className="-mr-2 shrink-0"
            >
              Dismiss
            </Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
