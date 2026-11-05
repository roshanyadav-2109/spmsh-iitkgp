"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DownloadIcon } from "@/components/ui/icons";
import { Table, type Column } from "@/components/ui/Table";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatDate, formatDateTime, formatTime } from "@/lib/dates";

export type ReportRow = {
  id: string;
  bookingRef: string;
  onDate: string;
  tokenLabel: string;
  slotTime: string | null;
  doctorName: string;
  patientName: string;
  patientAge: number;
  patientSex: string;
  patientPhone: string;
  patientType: string;
  patientIdNo: string | null;
  status: string;
  source: string;
  bookedOverPhone: boolean;
  isOverflow: boolean;
  bookedBy: string | null;
  createdAt: string;
};

type Summary = {
  doctorName: string;
  total: number;
  attended: number;
  noShow: number;
  cancelled: number;
  online: number;
  desk: number;
};

export function ReportView({
  rows,
  from,
  to,
}: {
  rows: ReportRow[];
  from: string;
  to: string;
}) {
  const [includeContact, setIncludeContact] = useState(false);

  const summary = useMemo(() => {
    const map = new Map<string, Summary>();
    for (const row of rows) {
      const entry = map.get(row.doctorName) ?? {
        doctorName: row.doctorName,
        total: 0,
        attended: 0,
        noShow: 0,
        cancelled: 0,
        online: 0,
        desk: 0,
      };
      entry.total += 1;
      if (row.status === "attended") entry.attended += 1;
      if (row.status === "no_show") entry.noShow += 1;
      if (row.status === "cancelled") entry.cancelled += 1;
      if (row.source === "reception") entry.desk += 1;
      else entry.online += 1;
      map.set(row.doctorName, entry);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [rows]);

  const summaryColumns: Column<Summary>[] = [
    { key: "doctor", header: "Doctor", stackedTitle: true, cell: (r) => r.doctorName },
    {
      key: "total",
      header: "Booked",
      align: "right",
      cell: (r) => <span className="tnum">{r.total}</span>,
    },
    {
      key: "attended",
      header: "Attended",
      align: "right",
      cell: (r) => <span className="tnum">{r.attended}</span>,
    },
    {
      key: "noshow",
      header: "Did not come",
      align: "right",
      cell: (r) => <span className="tnum">{r.noShow}</span>,
    },
    {
      key: "cancelled",
      header: "Cancelled",
      align: "right",
      cell: (r) => <span className="tnum">{r.cancelled}</span>,
    },
    {
      key: "online",
      header: "Online",
      align: "right",
      cell: (r) => <span className="tnum">{r.online}</span>,
    },
    {
      key: "desk",
      header: "At the desk",
      align: "right",
      cell: (r) => <span className="tnum">{r.desk}</span>,
    },
  ];

  const totals = summary.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      attended: acc.attended + row.attended,
      noShow: acc.noShow + row.noShow,
      cancelled: acc.cancelled + row.cancelled,
    }),
    { total: 0, attended: 0, noShow: 0, cancelled: 0 },
  );

  const exportCsv = () => {
    const headers = [
      "Date",
      "Token",
      "Reference",
      "Time",
      "Doctor",
      "Patient",
      "Age",
      "Sex",
      "Type",
      "ID number",
      "Status",
      "Source",
      "By phone",
      "Overflow",
      "Booked by",
      "Booked at",
    ];
    if (includeContact) headers.splice(9, 0, "Phone");

    const body = rows.map((row) => {
      const cells: (string | number)[] = [
        row.onDate,
        row.tokenLabel,
        row.bookingRef,
        formatTime(row.slotTime),
        row.doctorName,
        row.patientName,
        row.patientAge,
        row.patientSex,
        row.patientType,
        row.patientIdNo ?? "",
        row.status,
        row.source,
        row.bookedOverPhone ? "yes" : "no",
        row.isOverflow ? "yes" : "no",
        row.bookedBy ?? "",
        row.createdAt,
      ];
      if (includeContact) cells.splice(9, 0, row.patientPhone);
      return cells;
    });

    downloadCsv(`appointments-${from}-to-${to}.csv`, toCsv(headers, body));
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No appointments in this range"
        description="Widen the dates, or clear the doctor filter."
      />
    );
  }

  return (
    <div className="grid gap-8">
      <section aria-labelledby="summary">
        <h2 id="summary" className="text-21 tracking-tight">
          By doctor
        </h2>
        <p className="tnum mt-2 text-15">
          {formatDate(from)} to {formatDate(to)} · Booked {totals.total} · Attended{" "}
          {totals.attended} · Did not come {totals.noShow} · Cancelled{" "}
          {totals.cancelled}
        </p>
        <div className="mt-4">
          <Table
            caption="Appointments by doctor over the selected range"
            columns={summaryColumns}
            rows={summary}
            rowKey={(row) => row.doctorName}
          />
        </div>
      </section>

      <section aria-labelledby="export">
        <h2 id="export" className="text-21 tracking-tight">
          Export
        </h2>
        <label htmlFor="includeContact" className="mt-4 flex items-start gap-3 text-14">
          <input
            id="includeContact"
            type="checkbox"
            checked={includeContact}
            onChange={(event) => setIncludeContact(event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            Include patient phone numbers. Leave this off unless the file is needed for
            telephoning patients. A spreadsheet of phone numbers is personal data and
            should not be kept on a shared drive.
          </span>
        </label>
        <div className="mt-4">
          <Button onClick={exportCsv}>
            <DownloadIcon />
            Download {rows.length} rows as CSV
          </Button>
        </div>
      </section>

      <section aria-labelledby="recent">
        <h2 id="recent" className="text-21 tracking-tight">
          Most recent 50
        </h2>
        <div className="mt-4">
          <Table
            caption="The 50 most recently booked appointments in this range"
            columns={[
              {
                key: "date",
                header: "Date",
                stackedTitle: true,
                cell: (r: ReportRow) => (
                  <span className="tnum">{formatDate(r.onDate)}</span>
                ),
              },
              {
                key: "token",
                header: "Token",
                cell: (r: ReportRow) => <span className="tnum">{r.tokenLabel}</span>,
              },
              { key: "doctor", header: "Doctor", cell: (r: ReportRow) => r.doctorName },
              {
                key: "patient",
                header: "Patient",
                cell: (r: ReportRow) => r.patientName,
              },
              { key: "status", header: "Status", cell: (r: ReportRow) => r.status },
              {
                key: "by",
                header: "Booked by",
                cell: (r: ReportRow) => r.bookedBy ?? "Online",
              },
              {
                key: "at",
                header: "Booked at",
                cell: (r: ReportRow) => (
                  <span className="tnum">{formatDateTime(r.createdAt)}</span>
                ),
              },
            ]}
            rows={[...rows]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .slice(0, 50)}
            rowKey={(row) => row.id}
          />
        </div>
      </section>
    </div>
  );
}
