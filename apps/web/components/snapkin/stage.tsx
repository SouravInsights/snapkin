import type { CSSProperties, Ref } from "react"
import { CANVAS_SIZES, type SnapState } from "@/lib/snapkin/config"
import { backgroundCss, cardShadowCss, patternCss } from "@/lib/snapkin/derive"
import { TweetCard } from "./tweet-card"

export const SYSTEM_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

/**
 * The live canvas. Every measurement inside derives from the `--u`
 * container-query unit so the exported PNG is a true pixel-perfect
 * scale-up of this preview.
 */
export function Stage({
  state,
  ref,
}: {
  state: SnapState
  ref: Ref<HTMLDivElement>
}) {
  const pattern = patternCss(state.pattern, {
    intensity: state.intensity,
    rotation: state.rotation,
    opacity: state.opacity,
    blur: state.blur,
    blend: state.blend,
    presetIndex: state.preset,
  })

  const cardVars = {
    "--fs": state.fontSize,
    "--sc": state.scale / 100,
    "--w": state.width,
    "--r": state.radius,
    "--cbg": state.cardBg,
    "--ctx": state.cardText,
    "--shadow": cardShadowCss(state.shadow),
  } as CSSProperties

  return (
    <main
      aria-label="Preview"
      data-slot="stage"
      className="[container-type:size] grid min-h-0 min-w-0 place-items-center px-4 pt-2 pb-4 lg:px-9 lg:pb-9"
    >
      <div
        ref={ref}
        data-slot="canvas"
        style={{ "--ar": CANVAS_SIZES[state.size].ar } as CSSProperties}
        className="[container-type:inline-size] relative aspect-[var(--ar)] w-[min(100cqw,calc(100cqh*var(--ar)))] animate-in overflow-hidden rounded-2xl shadow-xl ring-1 ring-border duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
      >
        <div
          className="[container-type:size] absolute inset-0 isolate grid place-items-center overflow-hidden [--u:calc(100cqw/540)]"
          style={{ fontFamily: SYSTEM_FONT_STACK }}
        >
          <div
            data-slot="bg-layer"
            className="absolute inset-0"
            style={backgroundCss(
              state.bg,
              state.preset,
              state.angle,
              state.image
            )}
          />
          {pattern && (
            <div
              data-slot="pattern-layer"
              className="pointer-events-none absolute -inset-1/2"
              style={pattern}
            />
          )}
          <div className="contents" style={cardVars}>
            <TweetCard
              text={state.text}
              authorName={state.authorName}
              authorHandle={state.authorHandle}
              verified={state.verified}
              dateLabel={state.dateLabel}
              avatarUrl={state.avatarUrl}
              stats={state.stats}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
