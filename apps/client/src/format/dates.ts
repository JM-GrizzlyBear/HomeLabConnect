const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" });
const dateTimeFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short" });

/** "Jan 15, 2026" */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

/** "January 15, 2026 at 4:00 PM" */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}
