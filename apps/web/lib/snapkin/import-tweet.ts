/* Client-side tweet import: delegates to /api/tweet (server-side fetch — the
 * upstream endpoints are CORS-restricted). */

import { parseTweetUrl, type ImportedTweet } from "./tweet-data"

export type { ImportedTweet } from "./tweet-data"

export async function importTweet(rawUrl: string): Promise<ImportedTweet> {
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
  return data.tweet
}
