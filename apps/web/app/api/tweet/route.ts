/* GET /api/tweet?url=<tweet url>
 *
 * Imports tweet metadata server-side (the upstream endpoints are
 * CORS-restricted to their own origins, so browsers can't call them
 * directly).
 *
 * Sources, in order:
 *  1. fxtwitter — the only public source that returns *current* engagement
 *     (replies/reposts/likes/bookmarks/views) plus the author, timestamp and
 *     avatar. This is the single source of truth for every number on the card.
 *  2. syndication JSON — text, author, timestamp and like/reply counts. Used
 *     when fxtwitter is unavailable, and to fill a long-form post's full text
 *     when fxtwitter truncates it.
 *  3. vxtwitter — *text only*. Its engagement counters are a stale snapshot
 *     and must never reach the card.
 *  4. oEmbed — text + author + date only, no counts.
 */

import { formatCount, formatDateLabel } from "@/lib/snapkin/format"
import { parseTweetUrl, type ImportedTweet } from "@/lib/snapkin/tweet-data"

/* The syndication endpoint only fulfills requests that carry a `token`
 * parameter (any well-formed value). This is the token shape react-tweet
 * popularized. */
const syndicationToken = (id: string) =>
  ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\\.)/g, "")

const ORIGIN = (u: string) => `/api/avatar?u=${encodeURIComponent(u)}`

/* Engagement is live data: it keeps climbing after a post goes out, so nothing
 * in this route may be cached across requests. */
const NO_CACHE = { cache: "no-store" } as const

/* `text` from these sources is capped around 280 chars, which is how a
 * long-form post gets mistaken for a short one. */
const TEXT_CAP = 270

interface FxTweet {
  text?: string
  is_note_tweet?: boolean
  created_at?: string
  replies?: number
  retweets?: number
  likes?: number
  bookmarks?: number
  views?: number
  author?: {
    name?: string
    screen_name?: string
    avatar_url?: string
    verification?: { verified?: boolean; type?: string }
  }
}

interface SyndicationTweet {
  text?: string
  display_text_range?: [number, number]
  created_at?: string
  favorite_count?: number
  conversation_count?: number
  /** present (and `text` truncated ~278 chars) on long-form note tweets */
  note_tweet?: { id?: string }
  photos?: unknown[]
  user?: {
    name?: string
    screen_name?: string
    verified?: boolean
    is_blue_verified?: boolean
    profile_image_url_https?: string
  }
}

/* Metric order matches the card's existing layout: the sources we already had
 * come first, then the fields only fxtwitter exposes. */
type Stats = [string, string][]

/** The live counts, in card order. Reposts/Likes always render (as 0 when the
 * upstream omits them) so an imported card keeps the same shape every time. */
function liveStats(t: FxTweet): Stats {
  const stats: Stats = []
  if (typeof t.replies === "number") {
    stats.push(["Replies", formatCount(t.replies)])
  }
  stats.push(["Reposts", formatCount(t.retweets ?? 0)])
  stats.push(["Likes", formatCount(t.likes ?? 0)])
  if (typeof t.bookmarks === "number") {
    stats.push(["Bookmarks", formatCount(t.bookmarks)])
  }
  /* views are public and always present on fxtwitter; hidden ones read 0 */
  if (typeof t.views === "number") {
    stats.push(["Views", formatCount(t.views)])
  }
  return stats
}

const asDate = (s?: string) => {
  const d = s ? new Date(s) : new Date(NaN)
  return Number.isNaN(d.getTime()) ? null : d
}

/** fxtwitter: the primary source — live counts, author, timestamp, avatar. */
async function fromFxTwitter(
  handle: string,
  id: string
): Promise<{ tweet: ImportedTweet; fx: FxTweet } | null> {
  const res = await fetch(
    `https://api.fxtwitter.com/${encodeURIComponent(handle)}/status/${id}`,
    NO_CACHE
  )
  if (!res.ok) return null
  const body: { tweet?: FxTweet } | null = await res.json().catch(() => null)
  const t = body?.tweet
  if (!t || !t.text?.trim() || !t.author?.screen_name) return null

  const created = asDate(t.created_at)
  const avatar = t.author.avatar_url?.replace(
    /_(normal|200x200|400x400)\\./,
    "."
  )
  return {
    fx: t,
    tweet: {
      text: t.text.trim(),
      authorName: t.author.name ?? `@${t.author.screen_name}`,
      authorHandle: t.author.screen_name,
      verified: Boolean(t.author.verification?.verified),
      dateLabel: created ? formatDateLabel(created) : "",
      avatarUrl: avatar ? ORIGIN(avatar) : null,
      stats: liveStats(t),
    },
  }
}

/** syndication: text + author + likes/replies, no reposts/bookmarks/views. */
function fromSyndication(t: SyndicationTweet): ImportedTweet | null {
  const u = t.user
  const range = t.display_text_range
  const text = (t.text ?? "")
    .slice(range?.[0] ?? 0, range?.[1] ?? undefined)
    .trim()
  if (!text || !u?.screen_name) return null

  const created = asDate(t.created_at)
  const avatar = u.profile_image_url_https?.replace("_normal", "")

  return {
    text,
    authorName: u.name ?? `@${u.screen_name}`,
    authorHandle: u.screen_name,
    verified: Boolean(u.verified || u.is_blue_verified),
    dateLabel: created ? formatDateLabel(created) : "",
    avatarUrl: avatar ? ORIGIN(avatar) : null,
    stats: [], // counts are added by the caller from the same response
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

/** vxtwitter text used only when a long-form post comes back truncated with no
 * other way to expand it. Its counts are deliberately ignored. */
async function fetchLongText(
  handle: string,
  id: string,
  truncated: string,
  hadMediaLink: boolean
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.vxtwitter.com/${encodeURIComponent(handle)}/status/${id}`,
      NO_CACHE
    )
    if (!res.ok) return null
    const d: { text?: string } = await res.json()
    let text = (d.text ?? "").trim()
    // media-tweet texts end with a bare t.co link — the card doesn't render it
    if (hadMediaLink) text = text.replace(/\s*https?:\/\/t\.co\/\w+\s*$/, "")
    const anchor = truncated.replace(/[\s…]+$/u, "").slice(0, 60)
    if (!text || text.length <= truncated.length || !text.startsWith(anchor)) {
      return null
    }
    return text
  } catch {
    return null
  }
}

/** Fetch a long-form post's full text, in order of trustworthiness. */
async function expandText(
  parsed: { handle: string; id: string },
  truncated: string,
  hadMediaLink: boolean
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://cdn.syndication.twimg.com/tweet-result?id=${encodeURIComponent(
        parsed.id
      )}&lang=en&token=${syndicationToken(parsed.id)}`,
      NO_CACHE
    )
    if (res.ok) {
      const data: { text?: string; display_text_range?: [number, number] } =
        await res.json()
      const range = data.display_text_range
      const text = (data.text ?? "")
        .slice(range?.[0] ?? 0, range?.[1] ?? undefined)
        .trim()
      if (text.length > truncated.length && text.startsWith(truncated)) {
        return text
      }
    }
  } catch {
    /* fall through to vxtwitter */
  }
  return fetchLongText(parsed.handle, parsed.id, truncated, hadMediaLink)
}

/* A long-form note post has no note payload in any of these responses, so the
 * only text available is the ~278-char preview. That's why an import can look
 * "outdated": the card was showing the preview as if it were the whole post.
 * expandText() recovers the full body where it can; when it can't, we keep the
 * honest preview rather than fabricate the rest. */
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
    const primary = await fromFxTwitter(parsed.handle, parsed.id)
    if (primary) {
      const tweet = primary.tweet
      const truncated =
        Boolean(primary.fx.is_note_tweet) || tweet.text.length >= TEXT_CAP
      if (truncated) {
        const full = await expandText(
          parsed,
          tweet.text,
          /https?:\/\/t\.co\/\w+$/.test(tweet.text)
        )
        if (full) tweet.text = full
      }
      return Response.json({ ok: true, tweet })
    }
  } catch {
    /* fall through to syndication */
  }

  try {
    const res = await fetch(
      `https://cdn.syndication.twimg.com/tweet-result?id=${parsed.id}&lang=en&token=${syndicationToken(parsed.id)}`,
      NO_CACHE
    )
    if (res.ok) {
      const data: SyndicationTweet = await res.json()
      const tweet = data && fromSyndication(data)
      if (tweet) {
        if (typeof data.favorite_count === "number") {
          tweet.stats.push(["Likes", formatCount(data.favorite_count)])
        }
        if (typeof data.conversation_count === "number") {
          tweet.stats.unshift(["Replies", formatCount(data.conversation_count)])
        }
        if (data.note_tweet) {
          const full = await expandText(
            parsed,
            tweet.text,
            Boolean(data.photos?.length)
          )
          if (full) tweet.text = full
        }
        return Response.json({ ok: true, tweet })
      }
    }
  } catch {
    /* fall through to oEmbed */
  }

  try {
    const res = await fetch(
      `https://publish.x.com/oembed?url=${encodeURIComponent(
        `https://twitter.com/${parsed.handle}/status/${parsed.id}`
      )}`,
      NO_CACHE
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