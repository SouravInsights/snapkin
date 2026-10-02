import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from "react"
import { CANVAS_SIZES, type SnapState } from "@/lib/snapkin/config"
import { backgroundCss, cardShadowCss, patternCss } from "@/lib/snapkin/derive"
import { TweetCard } from "./tweet-card"

export const SYSTEM_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect

/**
 * The card never clips: measure its natural (unscaled) box against the
 * canvas and shrink it into the safe area when content grows. Purely
 * transform-based, so no layout loops and exports match the preview.
 */
function useAutoFit() {
  const [fit, setFit] = useState(1)
  const innerRef = useRef<HTMLDivElement>(null)

  useIsomorphicLayoutEffect(() => {
    const inner = innerRef.current
    if (!inner) return
    const card = inner.querySelector<HTMLElement>("[data-slot='tweet-card']")
    if (!card) return

    const compute = () => {
      const availW = inner.clientWidth * 0.92
      const availH = inner.clientHeight * 0.86
      const w = card.offsetWidth
      const h = card.offsetHeight
      if (!w || !h) return
      const next = Math.max(0.45, Math.min(1, availW / w, availH / h))
      setFit((prev) => (Math.abs(prev - next) > 0.005 ? next : prev))
    }

    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(inner)
    ro.observe(card)
    return () => ro.disconnect()
  }, [])

  return { fit, innerRef }
}

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

  const { fit, innerRef } = useAutoFit()

  const cardVars = {
    "--fs": state.fontSize,
    "--sc": fit,
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
          ref={innerRef}
          className="[container-type:size] absolute inset-0 isolate grid place-content-center justify-items-center overflow-hidden [--u:calc(100cqw/540)]"
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
