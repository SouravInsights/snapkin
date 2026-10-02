/* Shared tweet-import types + URL parsing (used by both the client and the
 * /api/tweet route handler — keep it DOM-free). */

export interface ImportedTweet {
  text: string
  authorName: string
  authorHandle: string
  verified: boolean
  dateLabel: string
  avatarUrl: string | null
  stats: [string, string][]
}

const TWEET_URL =
  /(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,20})\/status(?:es)?\/(\d{1,25})/

export function parseTweetUrl(
  raw: string
): { handle: string; id: string } | null {
  const match = raw.trim().match(TWEET_URL)
  const handle = match?.[1]
  const id = match?.[2]
  if (!handle || !id) return null
  return { handle, id }
}
