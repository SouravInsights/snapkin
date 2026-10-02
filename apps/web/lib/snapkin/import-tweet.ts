/* Best-effort tweet import via Twitter's public oEmbed endpoint.
 * Extracts text + author without executing any remote markup. */

export interface ImportedTweet {
  text: string
  authorName: string
  authorHandle: string
  dateLabel: string
}

const TWEET_URL =
  /(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,20})\/status(?:es)?\/(\d{5,25})/

export function parseTweetUrl(
  raw: string
): { handle: string; url: string } | null {
  const match = raw.trim().match(TWEET_URL)
  const handle = match?.[1]
  const id = match?.[2]
  if (!handle || !id) return null
  return { handle, url: `https://twitter.com/${handle}/status/${id}` }
}

/** Unwrap links to their text and drop trailing pic/t.co media links. */
function cleanParagraph(p: HTMLParagraphElement): string {
  p.querySelectorAll("a").forEach((a) => {
    const href = a.getAttribute("href") ?? ""
    if (/pic\.twitter\.com|twitter\.com\/i\/|\/photo\//.test(href)) {
      a.remove()
    } else {
      a.replaceWith(document.createTextNode(a.textContent ?? ""))
    }
  })
  return (p.textContent ?? "")
    .replace(/pic\.twitter\.com\/\w+/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export async function importTweet(rawUrl: string): Promise<ImportedTweet> {
  const parsed = parseTweetUrl(rawUrl)
  if (!parsed) {
    throw new Error("That doesn't look like a post link")
  }

  const res = await fetch(
    `https://publish.twitter.com/oembed?url=${encodeURIComponent(parsed.url)}`
  )
  if (!res.ok) {
    throw new Error("Couldn't load that post — it may be private or deleted")
  }
  const data: { html?: string; author_name?: string; author_url?: string } =
    await res.json()
  if (!data.html) throw new Error("Couldn't read that post")

  const doc = new DOMParser().parseFromString(data.html, "text/html")
  const p = doc.querySelector<HTMLParagraphElement>("blockquote p")
  const text = p ? cleanParagraph(p) : ""
  if (!text) throw new Error("That post has no text to import")

  const handle =
    data.author_url?.split("/").filter(Boolean).pop() ?? parsed.handle
  const date = doc.querySelector("blockquote > a")?.textContent?.trim() ?? ""

  return {
    text,
    authorName: data.author_name?.trim() || `@${handle}`,
    authorHandle: handle,
    dateLabel: date,
  }
}
