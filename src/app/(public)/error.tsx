"use client";

import { ButtonLink } from "@/components/ui/Button";
import { tel } from "@/lib/phone";
import { StateImage } from "@/components/ui/StateImage";

/**
 * Shown when a public page's data could not be read, instead of a page that
 * looks like an empty hospital. The OPD number is the public default from
 * lib/settings.ts, written here because this boundary renders on the client
 * and cannot read the settings table.
 */
const OPD_COUNTER = "03222-215306";

export default function PublicError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="page-width py-16 lg:py-24">
      <div className="max-w-2xl rounded-lg bg-tint p-6 sm:p-10">
        <StateImage name="error" className="w-56 sm:w-64" />
        <h1 className="mt-6 text-26 text-ink sm:text-32">
          This page didn&rsquo;t open properly
        </h1>
        <p className="mt-4 text-16 text-body">
          Please try again in a moment. For appointments or timings, call the OPD
          counter on{" "}
          <a href={tel(OPD_COUNTER)} className="tnum font-medium text-ink">
            {OPD_COUNTER}
          </a>
          .
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="ui-transition inline-flex h-11 items-center rounded-md bg-accent px-5 text-15 font-medium text-white hover:bg-accent-deep"
          >
            Try again
          </button>
          <ButtonLink href="/emergency">Emergency</ButtonLink>
        </div>
      </div>
    </div>
  );
}
