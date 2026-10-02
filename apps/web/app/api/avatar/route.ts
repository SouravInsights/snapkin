/* GET /api/avatar?u=<pbs.twimg.com image url>
 *
 * Same-origin proxy for profile images. The canvas exporter rasterizes the
 * DOM via SVG foreignObject, where remote images can taint or drop; proxying
 * keeps every pixel of the card renderable at export time.
 */

const ALLOWED_HOST = "pbs.twimg.com"

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("u") ?? ""
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return Response.json(
      { ok: false, message: "Bad image URL" },
      { status: 400 }
    )
  }
  if (url.protocol !== "https:" || url.hostname !== ALLOWED_HOST) {
    return Response.json({ ok: false, message: "Not allowed" }, { status: 400 })
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 60 * 60 * 24 * 7 },
    })
    if (!res.ok || !res.body) {
      return Response.json({ ok: false }, { status: 404 })
    }
    return new Response(res.body, {
      headers: {
        "content-type": res.headers.get("content-type") ?? "image/jpeg",
        "cache-control": "public, max-age=604800, immutable",
      },
    })
  } catch {
    return Response.json({ ok: false }, { status: 502 })
  }
}
