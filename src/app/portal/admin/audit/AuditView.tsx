"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DownloadIcon } from "@/components/ui/icons";
import { Table, type Column } from "@/components/ui/Table";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatDateTime } from "@/lib/dates";
import { actionLabel, detailLine, entityLabel, roleLabel } from "@/lib/auditLabels";

export type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  meta: unknown;
  createdAt: string;
  actorRole: string | null;
  actorName: string | null;
};

export function AuditView({
  rows,
  from,
  to,
}: {
  rows: AuditRow[];
  from: string;
  to: string;
}) {
  const columns: Column<AuditRow>[] = [
    {
      key: "when",
      header: "When",
      stackedTitle: true,
      cell: (row) => <span className="tnum">{formatDateTime(row.createdAt)}</span>,
    },
    { key: "action", header: "Action", cell: (row) => actionLabel(row.action) },
    {
      key: "who",
      header: "Who",
      cell: (row) => (
        <span>
          {row.actorName ?? "Public"}
          {row.actorRole ? (
            <span className="block text-13 text-muted">{roleLabel(row.actorRole)}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: "entity",
      header: "Record",
      /* The record type only. The row's UUID was printed under it, which
         identifies a row to the database and nothing to a reader; it stays in
         the log and is still exported, but it is not on screen. */
      cell: (row) => entityLabel(row.entity),
    },
    {
      key: "meta",
      header: "Detail",
      cell: (row) => <span className="text-13 text-muted">{detailLine(row.meta)}</span>,
    },
  ];

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Nothing recorded in this range"
        description="Widen the dates, or clear the filters."
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <p className="tnum text-15">{rows.length} entries</p>
        <Button
          onClick={() =>
            downloadCsv(
              `audit-${from}-to-${to}.csv`,
              toCsv(
                ["When", "Action", "Who", "Role", "Record", "Record id", "Detail"],
                rows.map((row) => [
                  row.createdAt,
                  actionLabel(row.action),
                  row.actorName ?? "Public",
                  roleLabel(row.actorRole),
                  entityLabel(row.entity),
                  /* The id is kept in the download and not on the screen: an
                     export is what gets sent to somebody tracing an incident,
                     and that is the one place the row reference earns its
                     keep. */
                  row.entityId ?? "",
                  detailLine(row.meta),
                ]),
              ),
            )
          }
        >
          <DownloadIcon />
          Download as CSV
        </Button>
      </div>

      <Table
        caption="Audit log entries"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
      />
    </div>
  );
}
