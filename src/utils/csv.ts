export function escapeCsvField(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function formatCsvRow(fields: (string | number | undefined | null)[]): string {
  return fields.map(escapeCsvField).join(",");
}
