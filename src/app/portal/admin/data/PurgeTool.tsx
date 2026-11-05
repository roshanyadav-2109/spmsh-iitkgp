"use client";

import { useEffect, useState, useTransition } from "react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { countPurgeable, purgeContacts } from "./actions";

export function PurgeTool() {
  const [busy, startTransition] = useTransition();
  const [months, setMonths] = useState("24");
  const [affected, setAffected] = useState<number | null>(null);
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  // Show the number before anything is destroyed.
  useEffect(() => {
    const value = Number.parseInt(months, 10);
    if (Number.isNaN(value) || value < 3) {
      setAffected(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void countPurgeable(value).then((count) => {
        if (!cancelled) setAffected(count);
      });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [months]);

  return (
    <form
      action={(data) =>
        startTransition(async () => {
          const result = await purgeContacts(data);
          if (result.ok) {
            setDone(result.rows ?? 0);
            setMessage(null);
            setConfirm("");
            setAffected(0);
          } else {
            setDone(null);
            setMessage(result.message ?? "That did not run.");
          }
        })
      }
      className="grid gap-5"
    >
      {message ? (
        <p
          role="alert"
          className="rounded-md border border-emergency p-3 text-14 text-emergency"
        >
          {message}
        </p>
      ) : null}
      {done !== null ? (
        <p
          role="status"
          className="rounded-md border border-line bg-tint-neutral p-3 text-14"
        >
          Contact details removed from {done}{" "}
          {done === 1 ? "appointment" : "appointments"}. Recorded in the audit log.
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="months" label="Older than (months)" hint="Three months at least">
          {(control) => (
            <Input
              {...control}
              name="months"
              inputMode="numeric"
              value={months}
              onChange={(event) => setMonths(event.target.value)}
            />
          )}
        </Field>

        <Field id="confirm" label="Type PURGE to confirm" hint="In capital letters">
          {(control) => (
            <Input
              {...control}
              name="confirm"
              value={confirm}
              autoComplete="off"
              onChange={(event) => setConfirm(event.target.value)}
            />
          )}
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-tint-neutral px-4 py-3">
        <p className="tnum text-15 text-ink">
          {affected === null
            ? "Enter a number of months"
            : affected === 0
              ? "No appointments would be affected"
              : `${affected} ${affected === 1 ? "appointment" : "appointments"} would be affected`}
        </p>
        <button
          type="submit"
          disabled={busy || confirm !== "PURGE" || !affected}
          className="inline-flex h-11 items-center rounded-md bg-bar px-5 text-15 font-medium text-white transition-colors hover:bg-bar-deep disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-muted"
        >
          {busy ? "Running…" : "Remove contact details"}
        </button>
      </div>
    </form>
  );
}
