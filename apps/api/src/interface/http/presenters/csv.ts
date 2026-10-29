import type { HttpResponse } from "../httpTypes.js";

// The byte-order mark makes Excel read the file as UTF-8 (names with ñ, the ₱ sign)
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

/** One cell: quoted when it holds a comma, quote or line break; formulas are defused. */
function csvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/** Rows (the first is the header) as a CSV download named `filename`. */
export function csvFile(
  rows: readonly (readonly string[])[],
  filename: string,
): HttpResponse<string> {
  const body = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  return {
    status: 200,
    body: BYTE_ORDER_MARK + body + "\r\n",
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  };
}
