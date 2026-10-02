/* GET /api/tweet?url=<tweet url>
 *
 * Imports tweet metadata server-side (the public syndication endpoint is
 * CORS-restricted to platform.twitter.com, so browsers can't call it
 * directly). Primary: syndication JSON (text, author, avatar, verified,
 * timestamp, real like/reply counts). Fallback: the oEmbed endpoint, which
 * carries text + author + date only.
 */

import { formatCount, formatDateLabel } from "@/lib/snapkin/format"
import { parseTweetUrl, type ImportedTweet } from "@/lib/snapkin/tweet-data"

const DAY = 60 * 60 * 24

/* The syndication endpoint only fulfills requests that carry a `token`
 * parameter (any well-formed value). This is the token shape react-tweet
 * popularized. */
const syndicationToken = (id: string) =>
  ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, "")

const ORIGIN = (u: string) => `/api/avatar?u=${encodeURIComponent(u)}`

interface SyndicationTweet {
  text?: string
  display_text_range?: [number, number]
  created_at?: string
  favorite_count?: number
  conversation_count?: number
  user?: {
    name?: string
    screen_name?: string
    verified?: boolean
    is_blue_verified?: boolean
    profile_image_url_https?: string
  }
}

function fromSyndication(t: SyndicationTweet): ImportedTweet | null {
  const u = t.user
  const range = t.display_text_range
  const text = (t.text ?? "")
    .slice(range?.[0] ?? 0, range?.[1] ?? undefined)
    .trim()
  if (!text || !u?.screen_name) return null

  const stats: [string, string][] = []
  if (typeof t.conversation_count === "number") {
    stats.push(["Replies", formatCount(t.conversation_count)])
  }
  if (typeof t.favorite_count === "number") {
    stats.push(["Likes", formatCount(t.favorite_count)])
  }

  const avatar = u.profile_image_url_https?.replace("_normal", "")

  return {
    text,
    authorName: u.name ?? `@${u.screen_name}`,
    authorHandle: u.screen_name,
    verified: Boolean(u.verified || u.is_blue_verified),
    dateLabel: t.created_at ? formatDateLabel(new Date(t.created_at)) : "",
    avatarUrl: avatar ? ORIGIN(avatar) : null,
    stats,
  }
}

const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

function fromOembedHtml(
  html: string,
  authorName: string,
  handle: string
): ImportedTweet | null {
  // <p>…text…</p> — unwrap links to their text, drop media (pic.twitter.com) links
  const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  if (!pMatch?.[1]) return null
  const text = decodeEntities(
    pMatch[1]
      .replace(
        /<a\b[^>]*href="[^"]*pic\.twitter\.com[^"]*"[^>]*>[\s\S]*?<\/a>/gi,
        ""
      )
      .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  )
  if (!text) return null

  const dateMatch = html.match(/>([A-Z][a-z]+ \d{1,2}, \d{4})</)
  return {
    text,
    authorName,
    authorHandle: handle,
    verified: false,
    dateLabel: dateMatch?.[1]
      ? formatDateLabel(new Date(dateMatch[1]), false)
      : "",
    avatarUrl: null,
    stats: [],
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url") ?? ""
  const parsed = parseTweetUrl(url)
  if (!parsed) {
    return Response.json(
      { ok: false, message: "That doesn't look like a post link" },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(
      `https://cdn.syndication.twimg.com/tweet-result?id=${parsed.id}&lang=en&token=${syndicationToken(parsed.id)}`,
      { next: { revalidate: DAY } }
    )
    if (res.ok) {
      const data: SyndicationTweet = await res.json()
      const tweet = data && fromSyndication(data)
      if (tweet) return Response.json({ ok: true, tweet })
    }
  } catch {
    /* fall through to oEmbed */
  }

  try {
    const res = await fetch(
      `https://publish.x.com/oembed?url=${encodeURIComponent(
        `https://twitter.com/${parsed.handle}/status/${parsed.id}`
      )}`,
      { next: { revalidate: DAY } }
    )
    if (res.ok) {
      const data: {
        html?: string
        author_name?: string
        author_url?: string
      } = await res.json()
      if (data.html) {
        const handle =
          data.author_url?.split("/").filter(Boolean).pop() ?? parsed.handle
        const tweet = fromOembedHtml(
          data.html,
          data.author_name?.trim() || `@${handle}`,
          handle
        )
        if (tweet) return Response.json({ ok: true, tweet })
      }
    }
  } catch {
    /* fall through to the error below */
  }

  return Response.json(
    {
      ok: false,
      message: "Couldn't load that post — it may be private or deleted",
    },
    { status: 404 }
  )
}
