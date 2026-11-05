"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { ChevronIcon } from "@/components/ui/icons";

type Shot = { src: string; alt: string };

/**
 * The visit, one step at a time: the steps listed on the left, a photograph
 * in the middle and the chosen step's words on the right. Every step is a
 * real button, so the list works from the keyboard as well.
 */
export function VisitTabs({ steps, shots }: { steps: string[]; shots: Shot[] }) {
  const [active, setActive] = useState(0);
  const shot = shots.length ? shots[active % shots.length] : undefined;

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <ol className="lg:col-span-4" aria-label="Steps of a visit">
        {steps.map((step, index) => {
          const on = index === active;
          return (
            <li key={step.slice(0, 40)} className="border-b border-line">
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setActive(index)}
                className={cn(
                  "flex w-full items-center justify-between gap-4 py-4 text-left text-16",
                  on ? "font-medium text-ink" : "text-ink hover:underline",
                )}
              >
                <span className="flex min-w-0 items-baseline gap-3">
                  <span className="tnum shrink-0 text-14">
                    Step {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="line-clamp-1">{firstWords(step)}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full border",
                    on ? "border-accent bg-accent text-white" : "border-line bg-white",
                  )}
                >
                  <ChevronIcon direction="right" />
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {shot ? (
        <div className="photo-tile relative aspect-[4/3] lg:col-span-4 lg:aspect-auto lg:min-h-80">
          <Image
            src={shot.src}
            alt={shot.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className={cn(shot ? "lg:col-span-4" : "lg:col-span-8")} aria-live="polite">
        <p className="tnum text-14 font-medium text-ink">
          Step {String(active + 1).padStart(2, "0")} of{" "}
          {String(steps.length).padStart(2, "0")}
        </p>
        <p className="mt-3 text-18 leading-[1.5] text-ink">{steps[active]}</p>
      </div>
    </div>
  );
}

/** The opening words of a step, used as its label in the list. */
function firstWords(text: string) {
  const words = text
    .replace(/[,.;:—–-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return words.slice(0, 5).join(" ");
}
