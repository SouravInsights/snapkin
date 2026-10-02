/* Isomorphic formatting helpers — shared by the client and route handlers. */

/** Card meta line: "9:50 PM · Mar 21, 2006" or "Mar 21, 2006". */
export function formatDateLabel(date: Date, withTime = true): string {
  if (Number.isNaN(date.getTime())) return ""
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  if (!withTime) return dateStr
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
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
