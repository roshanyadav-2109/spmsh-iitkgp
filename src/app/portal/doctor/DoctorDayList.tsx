"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/dates";
import { saveRemarks, setOwnStatus } from "./actions";

export type DoctorRow = {
  id: string;
  tokenLabel: string;
  isOverflow: boolean;
  slotTime: string | null;
  patientName: string;
  patientAge: number;
  patientSex: string;
  patientType: string;
  reason: string | null;
  status: string;
  remarks: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  booked: "Waiting",
  arrived: "Arrived",
  attended: "Attended",
  no_show: "Did not come",
  cancelled: "Cancelled",
};

/**
 * Used on a phone, on a desk, between patients. Rows are at least 44px tall on
 * a small screen and the two actions that matter are full-width buttons rather
 * than a menu. Remarks save when the box loses focus, so nothing has to be
 * submitted.
 */
export function DoctorDayList({
  rows,
  readOnly,
}: {
  rows: DoctorRow[];
  readOnly: boolean;
}) {
  const [busy, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const setStatus = (id: string, status: string) => {
    const data = new FormData();
    data.set("id", id);
    data.set("status", status);
    startTransition(async () => {
      const result = await setOwnStatus(data);
      setMessage(result.ok ? null : (result.message ?? "That did not work."));
    });
  };

  const storeRemarks = (id: string, remarks: string, original: string) => {
    if (remarks === original) return;
    const data = new FormData();
    data.set("id", id);
    data.set("remarks", remarks);
    startTransition(async () => {
      const result = await saveRemarks(data);
      if (result.ok) {
        setSaved(id);
        window.setTimeout(() => setSaved(null), 2000);
      } else {
        setMessage(result.message ?? "The remarks could not be saved.");
      }
    });
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No appointments on this day"
        description="Bookings appear here as soon as they are made, at the counter or online."
      />
    );
  }

  return (
    <div>
      {message ? (
        <p role="alert" className="mb-4 rounded-sm border border-navy p-3 text-14">
          {message}
        </p>
      ) : null}

      <ul className="grid gap-3">
        {rows.map((row) => {
          const cancelled = row.status === "cancelled";
          return (
            <li key={row.id} className={cn("py-1", cancelled && "line-through")}>
              <div className="grid gap-4 md:grid-cols-[minmax(0,3rem)_minmax(0,1fr)_minmax(0,20rem)] md:items-start md:gap-6">
                <p className="tnum text-21 tracking-tight">
                  {row.tokenLabel}
                  {row.isOverflow ? (
                    <span className="block text-12 text-muted">extra token</span>
                  ) : null}
                </p>

                <div>
                  <p className="text-16">
                    {row.patientName}
                    <span className="tnum text-muted">
                      {" "}
                      · {row.patientAge}/{row.patientSex.charAt(0)} · {row.patientType}
                    </span>
                  </p>
                  <p className="tnum mt-1 text-14 text-muted">
                    {formatTime(row.slotTime)}
                  </p>
                  {row.reason ? <p className="mt-2 text-14">{row.reason}</p> : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Chip variant={row.status === "attended" ? "filled" : "outline"}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </Chip>
                    {!readOnly && !cancelled ? (
                      <>
                        <Button
                          size="md"
                          variant={row.status === "attended" ? "secondary" : "primary"}
                          disabled={busy}
                          onClick={() => setStatus(row.id, "attended")}
                          className="min-h-11"
                        >
                          Attended
                        </Button>
                        <Button
                          size="md"
                          disabled={busy}
                          onClick={() => setStatus(row.id, "no_show")}
                          className="min-h-11"
                        >
                          Did not come
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={`remarks-${row.id}`}
                    className="text-13 font-medium text-ink"
                  >
                    Remarks
                    {saved === row.id ? (
                      <span className="font-normal text-muted"> — saved</span>
                    ) : null}
                  </label>
                  <Textarea
                    id={`remarks-${row.id}`}
                    className="mt-2"
                    rows={2}
                    defaultValue={row.remarks ?? ""}
                    disabled={readOnly || cancelled}
                    onBlur={(event) =>
                      storeRemarks(row.id, event.target.value, row.remarks ?? "")
                    }
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
