/* Isomorphic formatting helpers — shared by the client and route handlers. */

/** Card meta line: "9:50 PM · Mar 21, 2006" or "Mar 21, 2006".
 *
 * Formatting *must* happen on the client (or with an explicit timezone):
 * the viewer's own timezone is what X shows, and a server in UTC would
 * otherwise render a different clock time (and sometimes a different day). */
export function formatDateLabel(
  date: Date,
  options: { withTime?: boolean; timeZone?: string } = {}
): string {
  if (Number.isNaN(date.getTime())) return ""
  const { withTime = true, timeZone } = options
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  })
  if (!withTime) return dateStr
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  })
  return `${time} · ${dateStr}`
}

/** 311023 → "311K" */
export function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n)
}

/** True for any count that renders as a bare zero ("0", "0.0", "0K"). */
export function isZeroCount(count: string): boolean {
  return /^0(?:\.0+)?[kmb]?$/i.test(count.trim())
}
