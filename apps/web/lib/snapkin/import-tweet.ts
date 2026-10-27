/* Client-side tweet import: delegates to /api/tweet (server-side fetch — the
 * upstream endpoints are CORS-restricted). */

import { formatDateLabel } from "./format"
import { parseTweetUrl, type ImportedTweet } from "./tweet-data"

export type { ImportedTweet } from "./tweet-data"

/** The wire payload plus the date label, which is rendered in the viewer's own
 * timezone (matching X) rather than the server's. */
export type ImportedTweetView = ImportedTweet & { dateLabel: string }

export async function importTweet(rawUrl: string): Promise<ImportedTweetView> {
  if (!parseTweetUrl(rawUrl)) {
    throw new Error("That doesn't look like a post link")
  }
  let data: { ok: boolean; tweet?: ImportedTweet; message?: string }
  try {
    const res = await fetch(`/api/tweet?url=${encodeURIComponent(rawUrl)}`)
    data = await res.json()
  } catch {
    throw new Error("Couldn't reach the import service — check your connection")
  }
  if (!data.ok || !data.tweet) {
    throw new Error(
      data.message ?? "Couldn't load that post — it may be private or deleted"
    )
  }
  const tweet = data.tweet
  // A date-only source is parsed as UTC and formatted in UTC so the calendar
  // day never slips a day backward/forward for the viewer.
  const dateLabel = tweet.createdAt
    ? formatDateLabel(new Date(tweet.createdAt), {
        withTime: !tweet.dateOnly,
        timeZone: tweet.dateOnly ? "UTC" : undefined,
      })
    : ""
  return { ...tweet, dateLabel }
}
