"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tab = {
  id: string;
  label: string;
  panel: ReactNode;
};

/**
 * Roving tabindex with arrow-key navigation, per the WAI-ARIA tabs pattern.
 * The selected tab is marked by a 2px navy underline, not by a fill or a
 * colour change.
 */
export function Tabs({
  tabs,
  defaultTabId,
  label,
  className,
}: {
  tabs: Tab[];
  defaultTabId?: string;
  label: string;
  className?: string;
}) {
  const base = useId();
  const [active, setActive] = useState(defaultTabId ?? tabs[0]?.id);

  const move = (delta: number) => {
    const index = tabs.findIndex((tab) => tab.id === active);
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    if (!next) return;
    setActive(next.id);
    document.getElementById(`${base}-tab-${next.id}`)?.focus();
  };

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="flex gap-1">
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${base}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  move(1);
                }
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  move(-1);
                }
              }}
              className={cn(
                "ui-transition -mb-px border-b-2 px-3 py-2 text-14 font-medium",
                /* The tablist sits on white or on the tint, both light
                   grounds, so the selected marker is #0f5bd6 at 6.02:1 and
                   never #1e9ce5 at 3.03:1. The 2px underline is a meaningful
                   graphic and clears 3:1 on its own; aria-selected carries
                   the state for anyone not seeing the colour. */
                selected
                  ? "border-accent text-ink"
                  : "border-transparent text-muted hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${base}-panel-${tab.id}`}
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={tab.id !== active}
          tabIndex={0}
          className="pt-4"
        >
          {tab.id === active ? tab.panel : null}
        </div>
      ))}
    </div>
  );
}
