"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { formatDateTime } from "@/lib/dates";
import { isPlaceholder } from "@/lib/settings";

export type SettingRow = {
  key: string;
  value: string;
  label: string;
  is_booking_policy: boolean;
  updated_at: string;
};

type SaveResult = { ok: boolean; message?: string };

/** Keys whose value is a whole number of days or minutes. */
const NUMERIC_KEYS = new Set([
  "booking_window_days",
  "same_day_cutoff_minutes",
  "per_phone_daily_limit",
  "per_phone_weekly_limit",
  "public_cancel_cutoff_minutes",
]);

const BOOLEAN_KEYS = new Set(["overflow_booking_enabled"]);

const LONG_KEYS = new Set([
  "hospital_address",
  "emergency_location_text",
  "opd_timings_text",
]);

/* There is no second line under a setting's name.
   Each row used to carry a hint below its label, and once the labels were
   rewritten to say what the setting does, four of the nine hints were the
   label again in different words — "Most appointments one mobile number can
   make in any seven days" over "How many appointments one mobile number can
   make in any seven days." The two facts the hints held that the labels did
   not — that reception can book past the cutoff and it is recorded, and that
   reception can allow more than the daily limit with a reason — are in the
   labels now, which live in the database and can be edited without a
   deploy. */

/**
 * "opd_timings_text" -> "OPD timings text". Only reached when a settings row
 * was inserted without a label; every seeded row has one.
 */
function humanise(key: string): string {
  const words = key.replace(/_/g, " ").trim();
  const sentence = words.charAt(0).toUpperCase() + words.slice(1);
  return sentence.replace(/opd/gi, "OPD").replace(/md/gi, "MD");
}

export function SettingsManager({
  rows,
  save,
}: {
  rows: SettingRow[];
  save: (formData: FormData) => Promise<SaveResult>;
}) {
  const [busy, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const submit = (key: string, value: string) =>
    startTransition(async () => {
      const data = new FormData();
      data.set("key", key);
      data.set("value", value);
      const result = await save(data);
      if (result.ok) {
        setMessage(null);
        setSavedKey(key);
        window.setTimeout(() => setSavedKey(null), 2500);
      } else {
        setMessage(result.message ?? "That did not save.");
      }
    });

  const policy = rows.filter((row) => row.is_booking_policy);
  const content = rows.filter((row) => !row.is_booking_policy);

  const renderRow = (row: SettingRow) => (
    <li key={row.key}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get("value");
          submit(row.key, typeof value === "string" ? value : "");
        }}
        className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-start md:gap-8"
      >
        <div>
          {/* The label only. The raw settings key — opd_timings_text,
              lookup_image_1_alt — was printed under it, which is a column
              name from the database on a screen used by the hospital desk.
              Where a row has no label, the key is turned into words rather
              than shown as it is stored. */}
          <p className="text-15">{row.label || humanise(row.key)}</p>
          {isPlaceholder(row.value) ? (
            <p className="mt-2">
              <Chip>Not supplied</Chip>
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Field id={`setting-${row.key}`} label="Value">
            {(control) =>
              BOOLEAN_KEYS.has(row.key) ? (
                <Select
                  {...control}
                  name="value"
                  defaultValue={row.value.toLowerCase()}
                >
                  <option value="false">Off</option>
                  <option value="true">On</option>
                </Select>
              ) : LONG_KEYS.has(row.key) ? (
                <Textarea {...control} name="value" rows={3} defaultValue={row.value} />
              ) : (
                <Input
                  {...control}
                  name="value"
                  inputMode={NUMERIC_KEYS.has(row.key) ? "numeric" : undefined}
                  defaultValue={row.value}
                />
              )
            }
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={busy}>
              Save
            </Button>
            {savedKey === row.key ? (
              <span role="status" className="text-13">
                Saved
              </span>
            ) : (
              <span className="tnum text-13 text-muted">
                Last changed {formatDateTime(row.updated_at)}
              </span>
            )}
          </div>
        </div>
      </form>
    </li>
  );

  return (
    <div>
      {message ? (
        <p role="alert" className="mb-4 rounded-sm border border-navy p-3 text-14">
          {message}
        </p>
      ) : null}

      {policy.length > 0 ? (
        <section aria-labelledby="policy">
          <h2 id="policy" className="text-21 tracking-tight">
            Booking policy
          </h2>
          <ul className="mt-4 grid gap-8">{policy.map(renderRow)}</ul>
        </section>
      ) : null}

      {content.length > 0 ? (
        <section aria-labelledby="content" className="mt-12">
          <h2 id="content" className="text-21 tracking-tight">
            Contact and published content
          </h2>
          <p className="mt-2 max-w-prose text-14 text-muted">
            A value left as a PROVIDE token appears on the public site as a marked
            placeholder. Nothing is invented to fill the gap.
          </p>
          <ul className="mt-4 grid gap-8">{content.map(renderRow)}</ul>
        </section>
      ) : null}
    </div>
  );
}
