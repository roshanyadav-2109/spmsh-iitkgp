import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Column<Row> = {
  key: string;
  header: string;
  cell: (row: Row) => ReactNode;
  align?: "left" | "right";
  /** Drawn as the heading line of each stacked card rather than a dt/dd pair. */
  stackedTitle?: boolean;
  /** Left out of the stacked view entirely. */
  hideWhenStacked?: boolean;
  headerClassName?: string;
  cellClassName?: string;
};

type TableProps<Row> = {
  /** Required. Read by screen readers; shown on screen only when showCaption. */
  caption: string;
  showCaption?: boolean;
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  rowClassName?: (row: Row) => string | undefined;
  empty?: ReactNode;
  density?: "default" | "comfortable";
  className?: string;
};

/**
 * One column definition renders two views: a real <table> from 640px up, and
 * stacked definition rows below it. Dense data never gets a horizontal
 * scrollbar as its only affordance on a phone.
 */
export function Table<Row>({
  caption,
  showCaption = false,
  columns,
  rows,
  rowKey,
  rowClassName,
  empty,
  density = "default",
  className,
}: TableProps<Row>) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  const cellPad = density === "comfortable" ? "px-3 py-4" : "px-3 py-3";
  const stackedColumns = columns.filter((c) => !c.hideWhenStacked);
  const titleColumn = columns.find((c) => c.stackedTitle);

  return (
    <div className={className}>
      {showCaption ? <p className="mb-3 text-13 text-muted">{caption}</p> : null}

      {/* Tabular view. The scroll container matters: `html` has
          `overflow-x: hidden`, so a table wider than the viewport would be
          clipped with no way to reach the cut-off columns. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-14 leading-dense">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                /* 12px uppercase muted over a 1px royal rule. #4a5568 on
                   white is 5.33:1. Column heads read as labels rather than
                   as another row of data, which is what the old 13px navy
                   made them. Right-aligned columns get tabular figures so
                   the digits line up under their own heading. */
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "eyebrow border-b border-navy text-ink",
                    cellPad,
                    column.align === "right" ? "tnum text-right" : "text-left",
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className={rowClassName?.(row)}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    /* No rule between rows. A hairline under every row of a
                       78-row appointment board is 78 lines of ink doing what
                       the row's own padding already does; the header keeps
                       its single rule, which is the one that tells a reader
                       where the data starts. */
                    className={cn(
                      "align-top",
                      cellPad,
                      column.align === "right" ? "tnum text-right" : "text-left",
                      column.cellClassName,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stacked view below 640px */}
      <ul className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className={cn("rounded-sm border border-line p-3", rowClassName?.(row))}
          >
            {titleColumn ? (
              <p className="mb-2 text-15 font-medium text-ink">
                {titleColumn.cell(row)}
              </p>
            ) : null}
            <dl className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-3 gap-y-1 text-14 leading-dense">
              {stackedColumns
                .filter((column) => !column.stackedTitle)
                .map((column) => (
                  <div key={column.key} className="contents">
                    <dt className="text-13 text-muted">{column.header}</dt>
                    <dd className="text-ink">{column.cell(row)}</dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
