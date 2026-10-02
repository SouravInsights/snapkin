/* Pure builders that turn SnapState into CSS for the canvas layers. */

import type { CSSProperties } from "react"
import {
  BG_PRESETS,
  type BlendMode,
  type BgKind,
  type PatternId,
} from "./config"

const luminance = (hex: string): number => {
  const n = parseInt(hex.slice(1), 16)
  return (
    (0.2126 * ((n >> 16) & 255) +
      0.7152 * ((n >> 8) & 255) +
      0.0722 * (n & 255)) /
    255
  )
}

export type BgPreset = readonly [string, string, string, string]

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

const waveSvg = (fill: string, opacity: number, path: string) =>
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='${path}' fill='${fill}' fill-opacity='${opacity}'/></svg>`

const svgUrl = (svg: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(svg)}")`

export function backgroundCss(
  kind: BgKind,
  presetIndex: number,
  angle: number,
  image: string | null
): CSSProperties {
  const [, base, mid, pop] = presetAt(presetIndex)

  switch (kind) {
    case "solid":
      return { background: base }
    case "mesh":
      return {
        background: [
          `radial-gradient(at 18% 12%, ${base}, transparent 55%)`,
          `radial-gradient(at 88% 22%, ${pop}, transparent 52%)`,
          `radial-gradient(at 22% 92%, ${mid}, transparent 55%)`,
          `radial-gradient(at 92% 88%, ${base}, transparent 50%)`,
          pop,
        ].join(","),
      }
    case "wave": {
      const back = waveSvg(
        pop,
        0.55,
        "M0 66C18 54 38 80 58 68S88 56 100 64V100H0Z"
      )
      const front = waveSvg(
        pop,
        0.9,
        "M0 80C22 70 44 94 68 82S92 78 100 82V100H0Z"
      )
      return {
        backgroundImage: `${svgUrl(back)}, ${svgUrl(front)}, linear-gradient(180deg, ${base}, ${mid})`,
        backgroundSize: "100% 100%, 100% 100%, 100% 100%",
        backgroundRepeat: "no-repeat",
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
      return { background: `linear-gradient(${angle}deg, ${base}, ${mid})` }
  }
}

export interface PatternOpts {
  intensity: number
  rotation: number
  opacity: number
  blur: number
  blend: BlendMode
  presetIndex: number
}

/**
 * Pattern layer CSS. Patterns are drawn in "density units": the canvas's
 * smaller dimension divided into 420 parts. Size-based density (not
 * width-based) keeps the pattern equally rich on portrait stories and wide
 * LinkedIn plates, preview and export alike. Returns null for "none".
 */
export function patternCss(
  pattern: PatternId,
  { intensity, rotation, opacity, blur, blend, presetIndex }: PatternOpts
): CSSProperties | null {
  if (pattern === "none") return null

  const [, base] = presetAt(presetIndex)
  // Ink harmonized with the preset: keep the base color dominant so the
  // pattern reads as part of the artwork, never as an overlaid stencil
  const light = luminance(base) > 0.55
  const ink = light
    ? mixHex(base, "#171320", 0.5)
    : mixHex(base, "#FFFFFF", 0.55)

  const u = (n: number) =>
    `calc(min(100cqw, 100cqh) / 420 * ${Math.round(n * 1000) / 1000})`
  const cell = 92 - intensity * 0.55 // higher intensity → tighter spacing

  let backgroundImage: string
  let backgroundSize: string

  if (pattern === "dots") {
    // Fine dot lattice — airy spacing, small consistent dots
    backgroundImage = `radial-gradient(circle, ${ink} 0 ${u(1.7)}, transparent ${u(2)})`
    backgroundSize = `${u(cell)} ${u(cell)}`
  } else if (pattern === "grid") {
    // Graph-paper hairlines with an open cell
    backgroundImage = [
      `linear-gradient(${ink} 0 ${u(1)}, transparent 0)`,
      `linear-gradient(90deg, ${ink} 0 ${u(1)}, transparent 0)`,
    ].join(",")
    backgroundSize = `${u(cell)} ${u(cell)}`
  } else if (pattern === "diagonal") {
    // 45° hairlines — repeating gradient tiles seamlessly at any size
    backgroundImage = `repeating-linear-gradient(45deg, ${ink} 0 ${u(1)}, transparent 0 ${u(cell)})`
    backgroundSize = "100% 100%"
  } else if (pattern === "cross") {
    // Registration-mark crosses, round caps, centered per cell
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 8.6v6.8M8.6 12h6.8' fill='none' stroke='${ink}' stroke-width='1.6' stroke-linecap='round'/></svg>`
    backgroundImage = svgUrl(svg)
    backgroundSize = `${u(cell * 0.72)} ${u(cell * 0.72)}`
  } else {
    // waves — long smooth swells, not squiggles
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 36'><path d='M0 18C20 6 40 6 60 18S100 30 120 18' fill='none' stroke='${ink}' stroke-width='1.4'/></svg>`
    backgroundImage = svgUrl(svg)
    backgroundSize = `${u(cell * 1.6)} ${u(cell * 0.48)}`
  }

  return {
    backgroundImage,
    backgroundSize,
    backgroundPosition: "0 0",
    opacity: opacity / 100,
    filter: blur > 0 ? `blur(${u(blur * 0.25)})` : "blur(0px)",
    mixBlendMode: blend,
    transform: `rotate(${rotation}deg)`,
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
