import { AVATAR_GRADIENTS } from "@/lib/snapkin/config"
import { avatarGradientIndex } from "@/lib/snapkin/derive"

export interface TweetCardContent {
  text: string
  authorName: string
  authorHandle: string
  verified: boolean
  dateLabel: string
  avatarUrl: string | null
  stats: [string, string][]
}

const LINKISH = /([#@]\w+|https?:\/\/[^\s]+)/g
const IS_LINKISH = /^([#@]\w+|https?:\/\/\S+)$/

/** Renders post text with hashtag/mention/link highlights, newline-safe. */
function Text({ text }: { text: string }) {
  if (!text.trim()) {
    return (
      <p className="mt-[0.8em] mb-[0.7em] leading-[1.38]">
        <span className="[color:color-mix(in_srgb,var(--ctx)_42%,transparent)]">
          Your post shows up here…
        </span>
      </p>
    )
  }
  const parts = text.split(LINKISH)
  return (
    <p className="wrap-anywhere mt-[0.8em] mb-[0.7em] leading-[1.38] whitespace-pre-wrap">
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
  return (
    <svg
      className="size-[1.12em] shrink-0 fill-[#1D9BF0]"
      viewBox="0 0 24 24"
      aria-label="Verified"
    >
      <path d="M12 2l2.4 1.8 3-.2 1 2.8 2.5 1.7-.9 2.9.9 2.9-2.5 1.7-1 2.8-3-.2L12 22l-2.4-1.8-3 .2-1-2.8-2.5-1.7.9-2.9-.9-2.9 2.5-1.7 1-2.8 3 .2z" />
      <path
        d="M8.5 12.2l2.5 2.5 4.5-4.8"
        stroke="#fff"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
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
}: TweetCardContent) {
  const name = authorName.trim() || "Your name"
  const handle = authorHandle.trim().replace(/^@/, "") || "handle"
  const gradient =
    AVATAR_GRADIENTS[avatarGradientIndex(name, AVATAR_GRADIENTS.length)]

  return (
    <article
      data-slot="tweet-card"
      className="relative w-[calc(var(--w)*1%)] scale-[var(--sc)] rounded-[calc(var(--r)*var(--u))] [background-color:var(--cbg)] px-[1.15em] py-[1.05em] [font-size:calc(var(--fs)*var(--u))] leading-[1.35] [color:var(--ctx)] [box-shadow:var(--shadow)]"
    >
      <header className="flex items-center gap-[0.6em]">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="size-[2.4em] shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            className="grid size-[2.4em] shrink-0 place-items-center rounded-full font-bold text-white"
            style={{ background: gradient }}
            aria-hidden
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-[0.3em] text-[0.82em] leading-[1.2] font-bold">
            <span className="truncate">{name}</span>
            {verified && <VerifiedBadge />}
          </div>
          <div className="text-[0.74em] leading-[1.3] [color:color-mix(in_srgb,var(--ctx)_62%,transparent)]">
            @{handle}
          </div>
        </div>
      </header>
      <Text text={text} />
      {dateLabel !== "" && (
        <div className="text-[0.72em] [color:color-mix(in_srgb,var(--ctx)_62%,transparent)]">
          {dateLabel}
        </div>
      )}
      {stats.length > 0 && (
        <div className="mt-[0.6em] flex flex-wrap gap-x-[1em] gap-y-[0.4em] pt-[0.6em] text-[0.72em] [color:color-mix(in_srgb,var(--ctx)_62%,transparent)] [border-top:1px_solid_color-mix(in_srgb,var(--ctx)_14%,transparent)]">
          {stats.map(([label, count]) => (
            <span key={label}>
              <b className="font-bold [color:var(--ctx)]">{count}</b> {label}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
