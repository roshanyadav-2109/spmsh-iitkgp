"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { todayIST } from "@/lib/dates";
import { requestLeave } from "../actions";

export function LeaveRequest() {
  const [busy, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  return (
    <form
      action={(data) =>
        startTransition(async () => {
          const result = await requestLeave(data);
          setSent(result.ok);
          setMessage(result.ok ? null : (result.message ?? "That did not work."));
        })
      }
      className="mt-4 grid gap-4"
    >
      {message ? (
        <p role="alert" className="rounded-sm border border-navy p-3 text-14">
          {message}
        </p>
      ) : null}
      {sent ? (
        <p role="status" className="rounded-sm border border-navy p-3 text-14">
          The request has been sent to reception. It does not close booking until
          reception approves it.
        </p>
      ) : null}

      <Field id="on_date" label="Date">
        {(control) => (
          <Input {...control} name="on_date" type="date" min={todayIST()} required />
        )}
      </Field>

      <Field
        id="reason"
        label="Reason"
        hint="Seen by reception, and on the public page once approved."
      >
        {(control) => <Input {...control} name="reason" required maxLength={200} />}
      </Field>

      <div>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Sending…" : "Send request"}
        </Button>
      </div>
    </form>
  );
}
