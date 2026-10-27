import { AVATAR_GRADIENTS } from "@/lib/snapkin/config"
import { avatarGradientIndex } from "@/lib/snapkin/derive"
import { isZeroCount } from "@/lib/snapkin/format"

export interface TweetCardContent {
  text: string
  authorName: string
  authorHandle: string
  verified: boolean
  dateLabel: string
  avatarUrl: string | null
  stats: [string, string][]
  /** handle this post replies to, without the @ */
  replyTo?: string | null
  /** attached photo, already proxied same-origin */
  mediaUrl?: string | null
  /** natural width / height of the attached photo */
  mediaAspect?: number | null
}

const LINKISH = /([#@]\w+|https?:\/\/[^\s]+)/g
const IS_LINKISH = /^([#@]\w+|https?:\/\/\S+)$/

/** Renders post text with hashtag/mention/link highlights, newline-safe. */
function Text({ text, compact }: { text: string; compact?: boolean }) {
  const parts = text.split(LINKISH)
  return (
    <p
      className={
        "wrap-anywhere text-pretty leading-[1.45] tracking-[-0.006em] whitespace-pre-wrap " +
        (compact ? "mt-[0.5em]" : "mt-[0.95em]")
      }
    >
      {parts.map((part, i) =>
        IS_LINKISH.test(part) ? (
          <span className="text-[#1D9BF0]" key={i}>
            {part}
          </span>
        ) : (
          part
        )
      )}
    </p>
  )
}

function VerifiedBadge() {
  // X's verified seal as a single even-odd path — the check is a cutout,
  // so it always shows the card color through it
  return (
    <svg
      className="size-[1.05em] shrink-0 fill-[#1D9BF0]"
      viewBox="0 0 24 24"
      aria-label="Verified"
    >
      <path
        fillRule="evenodd"
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"
      />
    </svg>
  )
}

export function TweetCard({
  text,
  authorName,
  authorHandle,
  verified,
  dateLabel,
  avatarUrl,
  stats,
  replyTo,
  mediaUrl,
  mediaAspect,
}: TweetCardContent) {
  const name = authorName.trim() || "Your name"
  const handle = authorHandle.trim().replace(/^@/, "") || "handle"
  const gradient =
    AVATAR_GRADIENTS[avatarGradientIndex(name, AVATAR_GRADIENTS.length)]
  const hasText = text.trim().length > 0
  const hasMedia = Boolean(mediaUrl)

  const visibleStats = stats.filter(([, count]) => !isZeroCount(count))
  // Views is context, not engagement — it belongs with the timestamp.
  const views = visibleStats.find(([label]) => label.toLowerCase() === "views")
  const engagement = visibleStats.filter(
    ([label]) => label.toLowerCase() !== "views"
  )
  const meta = [dateLabel, views ? `${views[1]}\u00A0views` : ""]
    .filter(Boolean)
    .join(" · ")
  const showFooter =
    (hasText || hasMedia) && (Boolean(meta) || engagement.length > 0)

  return (
    <article
      data-slot="tweet-card"
      className="relative w-[calc(var(--w)*1%)] scale-[var(--sc)] rounded-[calc(var(--r)*var(--u))] [background-color:var(--cbg)] px-[1.18em] py-[1.1em] [font-size:calc(var(--fs)*var(--u))] leading-[1.4] [color:var(--ctx)] [box-shadow:var(--shadow)]"
    >
      <header className="flex items-center gap-[0.72em]">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="size-[2.5em] shrink-0 rounded-full object-cover [box-shadow:0_0_0_1px_var(--ctx-line)]"
          />
        ) : (
          <div
            className="grid size-[2.5em] shrink-0 place-items-center rounded-full text-[0.95em] font-semibold tracking-[-0.02em] text-white [box-shadow:0_0_0_1px_var(--ctx-line)]"
            style={{ background: gradient }}
            aria-hidden
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[0.26em] text-[0.88em] leading-[1.22] font-bold tracking-[-0.014em]">
            <span className="truncate">{name}</span>
            {verified && <VerifiedBadge />}
          </div>
          <div className="mt-[0.1em] truncate text-[0.76em] leading-[1.32] [color:var(--ctx-muted)]">
            @{handle}
          </div>
        </div>
      </header>

      {replyTo && (
        <div className="mt-[0.75em] text-[0.76em] leading-[1.35] [color:var(--ctx-muted)]">
          Replying to{" "}
          <span className="text-[#1D9BF0]">@{replyTo.replace(/^@/, "")}</span>
        </div>
      )}

      {hasText ? (
        <Text text={text} compact={Boolean(replyTo)} />
      ) : (
        !hasMedia && (
          <p className="mt-[0.95em] leading-[1.45] text-pretty [color:var(--ctx-faint)]">
            Your post shows up here…
          </p>
        )
      )}

      {mediaUrl && (
        <div
          className={
            "overflow-hidden rounded-[calc(var(--r)*var(--u)*0.58)] [border:1px_solid_var(--ctx-line)] " +
            (hasText ? "mt-[0.25em]" : "mt-[0.85em]")
          }
          style={{ aspectRatio: String(mediaAspect ?? 16 / 9) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl} alt="" className="size-full object-cover" />
        </div>
      )}

      {showFooter && (
        <footer className="mt-[1.05em] flex flex-col gap-[0.45em]">
          {engagement.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-[1.05em] gap-y-[0.32em] text-[0.77em] leading-[1.14] tabular-nums">
              {engagement.map(([label, count]) => (
                <span
                  key={label}
                  aria-label={`${count} ${label}`}
                  className="flex shrink-0 items-baseline gap-[0.24em] whitespace-nowrap"
                >
                  <span className="font-medium tracking-[-0.004em] [color:var(--ctx)]">
                    {count}
                  </span>
                  <span className="lowercase [color:var(--ctx-muted)]">
                    {label}
                  </span>
                </span>
              ))}
            </div>
          )}
          {meta && (
            <div className="text-[0.72em] leading-[1.35] tracking-[0.002em] tabular-nums [color:var(--ctx-muted)]">
              {meta}
            </div>
          )}
        </footer>
      )}
    </article>
  )
}
