import Link from "next/link";
import { PurgeTool } from "./PurgeTool";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireTech } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { ChevronIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

const REMOVED = [
  "Patient phone number",
  "Roll or employee number",
  "Reason for the visit",
];
const KEPT = [
  "Token and booking reference",
  "Date and doctor",
  "Outcome: attended, did not come or cancelled",
];

export default async function DataToolsPage() {
  await requireTech();
  const supabase = await createServerSupabase();

  const [{ count: total }, { count: purged }, { data: oldest }] = await Promise.all([
    supabase.from("appointments").select("id", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .not("contact_purged_at", "is", null),
    supabase.from("appointments").select("on_date").order("on_date").limit(1),
  ]);

  const oldestDate = oldest?.[0]?.on_date;

  return (
    <div className="page-width py-8">
      <h1 className="text-26 tracking-tighter">Data tools</h1>

      <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Appointments held", value: String(total ?? 0) },
          { label: "Contact details already removed", value: String(purged ?? 0) },
          {
            label: "Oldest appointment",
            value: oldestDate ? formatDate(oldestDate) : "None yet",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-line bg-white px-5 py-4"
          >
            <dt className="text-13 text-muted">{item.label}</dt>
            <dd className="tnum mt-1 text-32 font-medium leading-none tracking-tight text-ink">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Main task: removing old contact details. */}
        <section
          aria-labelledby="purge"
          className="rounded-lg border border-line bg-white p-6 lg:col-span-8 lg:p-8"
        >
          <h2 id="purge" className="text-21 tracking-tight">
            Remove old contact details
          </h2>
          <p className="mt-2 text-15 text-body">
            Clears personal details from older appointments. Counts and history stay as
            they are.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md bg-tint-neutral p-4">
              <h3 className="font-sans text-14 font-medium tracking-normal text-ink">
                Removed
              </h3>
              <ul className="mt-2 grid gap-1.5 text-14 text-body">
                {REMOVED.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md bg-tint-neutral p-4">
              <h3 className="font-sans text-14 font-medium tracking-normal text-ink">
                Kept
              </h3>
              <ul className="mt-2 grid gap-1.5 text-14 text-body">
                {KEPT.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-6 rounded-md border border-emergency px-4 py-3 text-14 text-emergency">
            This cannot be undone. Export first if the numbers are still needed.
          </p>

          <div className="mt-6 border-t border-line pt-6">
            <PurgeTool />
          </div>
        </section>

        {/* Side task: export. */}
        <section
          aria-labelledby="export"
          className="h-fit rounded-lg border border-line bg-white p-6 lg:col-span-4 lg:p-8"
        >
          <h2 id="export" className="text-21 tracking-tight">
            Export appointments
          </h2>
          <p className="mt-2 text-15 text-body">
            Choose the dates, and whether to include phone numbers, on the reports
            screen.
          </p>
          <Link
            href="/portal/reception/reports"
            className="mt-6 inline-flex h-11 items-center gap-1.5 rounded-md border border-ink px-5 text-15 font-medium text-ink no-underline hover:bg-tint-neutral"
          >
            Open reports
            <ChevronIcon direction="right" />
          </Link>
        </section>
      </div>
    </div>
  );
}
