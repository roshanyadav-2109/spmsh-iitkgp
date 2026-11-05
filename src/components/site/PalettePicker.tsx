"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { DEFAULT_PALETTE, PALETTES, PALETTE_KEY } from "@/lib/palette";

function apply(id: string) {
  const root = document.documentElement;
  if (id === DEFAULT_PALETTE) delete root.dataset.palette;
  else root.dataset.palette = id;
}

/**
 * A review tool, not a feature: lets the owner flip the whole site between
 * the colour options and compare them on real pages. The choice is kept in
 * this browser only. Remove this component (and the script in the root
 * layout) once a palette is chosen and written into the @theme block.
 */
export function PalettePicker() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string>(DEFAULT_PALETTE);

  useEffect(() => {
    try {
      setCurrent(localStorage.getItem(PALETTE_KEY) ?? DEFAULT_PALETTE);
    } catch {
      /* storage blocked: the picker still works for this page view */
    }
  }, []);

  const choose = (id: string) => {
    setCurrent(id);
    apply(id);
    try {
      localStorage.setItem(PALETTE_KEY, id);
    } catch {
      /* storage blocked */
    }
  };

  return (
    <div
      data-print="hide"
      data-surface="light"
      className="fixed bottom-4 right-4 z-50 hidden sm:block w-64 rounded-lg border border-line-strong bg-white p-3 text-14 text-ink"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between font-medium"
      >
        Colour options
        <span className="text-13 text-faint">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <ul className="mt-2 grid gap-1">
          {PALETTES.map((palette) => {
            const active = palette.id === current;
            return (
              <li key={palette.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => choose(palette.id)}
                  className={cn(
                    "ui-transition flex w-full items-center gap-3 rounded-md px-2 py-2 text-left",
                    active ? "bg-accent-soft font-medium" : "",
                  )}
                >
                  <span className="flex shrink-0">
                    {palette.swatch.map((colour) => (
                      <span
                        key={colour}
                        aria-hidden="true"
                        className="-mr-1 h-5 w-5 rounded-full border-2 border-white"
                        style={{ backgroundColor: colour }}
                      />
                    ))}
                  </span>
                  <span className="ml-1">{palette.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
