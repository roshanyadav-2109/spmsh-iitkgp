/**
 * CSV export.
 *
 * Values are quoted and internal quotes doubled, per RFC 4180. A leading
 * `=`, `+`, `-` or `@` is prefixed with an apostrophe: without that, a
 * patient name or reason starting with one of those characters is treated as
 * a formula when the file is opened in a spreadsheet.
 */
export function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export function toCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) lines.push(row.map(csvCell).join(","));
  // A BOM so Excel opens it as UTF-8 rather than the system codepage.
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
