/** API timestamps use UTC with millisecond precision; business DATE fields stay YYYY-MM-DD. */
export function toUtcTimestamp(value: Date | string): string {
  return new Date(value).toISOString();
}
