/* Pure builders that turn SnapState into CSS for the canvas layers. */

import type { CSSProperties } from "react"
import {
  BG_PRESETS,
  type BlendMode,
  type BgKind,
  type PatternId,
} from "./config"
import { PATTERN_SVG } from "./patterns"

const luminance = (hex: string): number => {
  const n = parseInt(hex.slice(1), 16)
  return (
    (0.2126 * ((n >> 16) & 255) +
      0.7152 * ((n >> 8) & 255) +
      0.0722 * (n & 255)) /
    255
  )
}

export type BgPreset = readonly [
  name: string,
  base: string,
  mid: string,
  pop: string,
  tone: "light" | "dark" | "flat",
]

/** Index-safe preset lookup — wraps and never returns undefined. */
export function presetAt(index: number): BgPreset {
  const safe =
    ((index % BG_PRESETS.length) + BG_PRESETS.length) % BG_PRESETS.length
  return BG_PRESETS[safe] ?? BG_PRESETS[0]!
}

/** sRGB channel mix (t = weight of b). Hex in, hex out — safe everywhere,
 * including SVG data-URIs and the foreignObject export path. */
const mixHex = (a: string, b: string, t: number): string => {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (shift: number) =>
    Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t)
  const to2 = (v: number) => v.toString(16).padStart(2, "0")
  return `#${to2(ch(16))}${to2(ch(8))}${to2(ch(0))}`
}

const svgUrl = (svg: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(svg)}")`

export function backgroundCss(
  kind: BgKind,
  presetIndex: number,
  angle: number,
  image: string | null
): CSSProperties {
  const [, base, mid, pop] = presetAt(presetIndex)
  const light = luminance(base) > 0.55

  switch (kind) {
    case "solid":
      return { background: base }
    case "mesh":
      return {
        background: [
          `radial-gradient(65% 55% at 80% 10%, ${withAlpha(pop, 0.9)}, transparent 68%)`,
          `radial-gradient(70% 60% at 18% 88%, ${withAlpha(mixHex(mid, pop, 0.35), 0.95)}, transparent 72%)`,
          `linear-gradient(${angle}deg, ${base}, ${mixHex(base, mid, 0.4)})`,
        ].join(", "),
      }
    case "halo": {
      // A centered studio glow — the card sits inside the light.
      return {
        background: [
          `radial-gradient(68% 56% at 50% 44%, ${withAlpha(pop, light ? 0.8 : 0.92)}, transparent 70%)`,
          `radial-gradient(120% 100% at 50% 44%, ${mixHex(base, mid, 0.45)}, ${base} 76%)`,
        ].join(", "),
      }
    }
    case "image":
      return image
        ? {
            backgroundImage: `url("${image}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: base,
          }
        : { background: base }
    case "gradient":
    default:
      return {
        background: [
          `radial-gradient(120% 90% at 82% 0%, ${withAlpha(pop, light ? 0.5 : 0.55)}, transparent 62%)`,
          `linear-gradient(${angle}deg, ${base}, ${mid})`,
        ].join(", "),
      }
  }
}

export interface PatternOpts {
  intensity: number
  rotation: number
  opacity: number
  blur: number
  blend: BlendMode
  presetIndex: number
  /** explicit pattern ink; null/undefined derives it from the palette */
  color?: string | null
}

const PATTERN_TILE: Record<string, (cell: number) => [number, number]> = {
  stripes: (c) => [c * 0.8, c * 0.8],
  maze: (c) => [c * 3, c * 3],
  isometric: (c) => [c * 2.6, c * 2.6],
  chevron: (c) => [c * 2, c * 2],
  faceted: (c) => [c * 3.6, c * 3],
  zigzag: (c) => [c * 1.8, c * 1.8],
}

/**
 * Pattern layer CSS. The geometry comes from the SVG Backgrounds free set
 * (see patterns.ts); `INK` in each source is swapped for a tonal ink derived
 * from the palette. Sizes are in "density units": the canvas's smaller
 * dimension divided into 420 parts, so preview and export match. A custom
 * `unit` lets a pattern render into a small thumbnail instead.
 */
export function patternCss(
  pattern: PatternId,
  {
    intensity,
    rotation,
    opacity,
    blur,
    blend,
    presetIndex,
    color,
  }: PatternOpts,
  unit?: (n: number) => string
): CSSProperties | null {
  if (pattern === "none") return null
  const source = PATTERN_SVG[pattern]
  const tile = PATTERN_TILE[pattern]
  if (!source || !tile) return null

  const [, base, mid] = presetAt(presetIndex)
  const light = luminance(base) > 0.55
  // Explicit color wins; otherwise a tonal ink derived from the palette's mid
  // tone (its deepest shade on light fields, toward white on dark fields).
  const ink =
    color ??
    (light ? mixHex(mid, "#0C0A10", 0.62) : mixHex(mid, "#FFFFFF", 0.5))

  const u =
    unit ??
    ((n: number) =>
      `calc(min(100cqw, 100cqh) / 420 * ${Math.round(n * 1000) / 1000})`)
  const cell = 88 - intensity * 0.6
  const [tw, th] = tile(cell)

  return {
    backgroundImage: svgUrl(source.replaceAll("INK", ink)),
    backgroundSize: `${u(tw)} ${u(th)}`,
    backgroundPosition: "0 0",
    backgroundRepeat: "repeat",
    opacity: opacity / 100,
    filter: blur > 0 ? `blur(${u(blur * 0.35)})` : undefined,
    mixBlendMode: blend,
    transform: rotation === 0 ? undefined : `rotate(${rotation}deg)`,
  }
}

/** Layered soft shadow for the tweet card; strength 0–100. Values in --u units. */
export function cardShadowCss(strength: number): string {
  if (strength <= 0) return "none"
  const t = strength / 100
  const layer = (y: number, b: number, o: number) =>
    `0 calc(${y.toFixed(1)} * var(--u)) calc(${b.toFixed(1)} * var(--u)) rgb(40 25 90 / ${o.toFixed(3)})`
  return [
    layer(1 + 2 * t, 2 + 4 * t, 0.06 + 0.06 * t),
    layer(4 + 12 * t, 12 + 20 * t, 0.08 + 0.1 * t),
    layer(12 + 32 * t, 32 + 56 * t, 0.06 + 0.12 * t),
  ].join(", ")
}

/** Deterministic avatar gradient index from a name. */
export function avatarGradientIndex(name: string, count: number): number {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return hash % count
}

/** Hex color → rgba() at a given alpha. Used to derive muted text/line colors
 * in JS instead of `color-mix()`, which is not reliably rasterized by the
 * SVG-foreignObject export path on every browser. */
export function withAlpha(color: string, alpha: number): string {
  const hex = color.trim().replace(/^#/, "")
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex
  if (!/^[0-9a-f]{6}$/i.test(full)) return color
  const n = parseInt(full, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
