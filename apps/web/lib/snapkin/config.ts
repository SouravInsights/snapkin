/* Snapkin state model, presets, and defaults. Pure data — no React. */

import { formatDateLabel } from "./format"

export const TABS = ["post", "tweet", "canvas", "pattern"] as const
export type TabId = (typeof TABS)[number]

export const CANVAS_SIZES = {
  story: { label: "Story", ar: 9 / 16, out: [1080, 1920], rect: [10, 18] },
  post: { label: "Post", ar: 4 / 5, out: [1080, 1350], rect: [14, 17] },
  linkedin: {
    label: "LinkedIn",
    ar: 1200 / 627,
    out: [1200, 627],
    rect: [24, 13],
  },
} as const
export type CanvasSizeId = keyof typeof CANVAS_SIZES

export const BG_KINDS = [
  ["gradient", "Gradient"],
  ["solid", "Solid"],
  ["mesh", "Mesh"],
  ["halo", "Halo"],
  ["image", "Photo"],
] as const
export type BgKind = (typeof BG_KINDS)[number][0]

/** Background palettes: [name, base, mid, pop, tone].
 *
 * Each family is built in OKLCH with a constant hue: `base` is the field,
 * `mid` carries the hue and deepens the gradient, `pop` is the highlight
 * used by the gradient bloom and mesh. Light families step ~6 L*; dark
 * families keep the same hue discipline at a much lower lightness. */
export const BG_PRESETS = [
  // light
  ["Porcelain", "#F8F3EB", "#E8DAC7", "#EDD6AD", "light"],
  ["Blush", "#FCF0F2", "#F3CCD1", "#FED3C0", "light"],
  ["Mist", "#EAF3F8", "#BEDDED", "#BDE7EF", "light"],
  ["Sage", "#F1F5EB", "#D4E0C0", "#EDE8C6", "light"],
  ["Apricot", "#FDF1EA", "#F3CBB5", "#F6E2C0", "light"],
  ["Lilac", "#F3F0FB", "#D9CDF1", "#F4D1F0", "light"],
  ["Butter", "#F9F5E6", "#EADEB2", "#E6F1CC", "light"],
  ["Clay", "#F3E5DC", "#DEBCAD", "#EFC8AA", "light"],
  // dark
  ["Ink", "#181B1F", "#090F16", "#2D415A", "dark"],
  ["Midnight", "#131A2B", "#050D22", "#374E81", "dark"],
  ["Forest", "#0F1F14", "#021308", "#325B3B", "dark"],
  ["Oxblood", "#291414", "#1D0607", "#7A393B", "dark"],
  ["Plum", "#211526", "#15081A", "#623F71", "dark"],
  ["Espresso", "#221810", "#180B04", "#68482D", "dark"],
  ["Graphite", "#1C1D1F", "#0F1113", "#40454D", "dark"],
  ["Teal", "#0B1E1E", "#001212", "#0B5C5C", "dark"],
  // flat — solid, saturated colors (base = mid = pop)
  ["Coral", "#FF6A57", "#FF6A57", "#FF6A57", "flat"],
  ["Amber", "#F5A623", "#F5A623", "#F5A623", "flat"],
  ["Sunflower", "#F7C948", "#F7C948", "#F7C948", "flat"],
  ["Lime", "#9BD14A", "#9BD14A", "#9BD14A", "flat"],
  ["Emerald", "#12B886", "#12B886", "#12B886", "flat"],
  ["Teal Flats", "#0FB5AE", "#0FB5AE", "#0FB5AE", "flat"],
  ["Azure", "#3D7DF6", "#3D7DF6", "#3D7DF6", "flat"],
  ["Violet", "#7C5CF6", "#7C5CF6", "#7C5CF6", "flat"],
  ["Magenta", "#E0449A", "#E0449A", "#E0449A", "flat"],
  ["Slate", "#1E293B", "#1E293B", "#1E293B", "flat"],
] as const

/** Patterns are tonal, large-scale motifs — never technical tiles or gray
 * line work. Grain, vignette and light live here too as the finishing
 * touches that make a backdrop feel photographed. */
export const PATTERNS = [
  ["none", "None"],
  ["stripes", "Diagonal stripes"],
  ["maze", "Maze"],
  ["isometric", "Isometric"],
  ["chevron", "Chevron"],
  ["faceted", "Faceted"],
  ["zigzag", "Zigzag"],
] as const
export type PatternId = (typeof PATTERNS)[number][0]

/** Each pattern's recommended starting point. The SVG sources carry their
 * own shading, so the layer opacity starts at 100 and only ever reduces. */
export const PATTERN_DEFAULTS: Record<
  PatternId,
  {
    intensity?: number
    opacity?: number
    blur?: number
    rotation?: number
    blend?: BlendMode
  }
> = {
  none: {},
  stripes: {
    intensity: 44,
    opacity: 100,
    blur: 0,
    rotation: 0,
    blend: "normal",
  },
  maze: { intensity: 44, opacity: 100, blur: 0, rotation: 0, blend: "normal" },
  isometric: {
    intensity: 44,
    opacity: 100,
    blur: 0,
    rotation: 0,
    blend: "normal",
  },
  chevron: {
    intensity: 44,
    opacity: 100,
    blur: 0,
    rotation: 0,
    blend: "normal",
  },
  faceted: {
    intensity: 44,
    opacity: 100,
    blur: 0,
    rotation: 0,
    blend: "normal",
  },
  zigzag: {
    intensity: 44,
    opacity: 100,
    blur: 0,
    rotation: 0,
    blend: "normal",
  },
}

export const BLEND_MODES = [
  ["normal", "Normal"],
  ["multiply", "Multiply"],
  ["screen", "Screen"],
  ["overlay", "Overlay"],
  ["soft-light", "Soft light"],
  ["difference", "Difference"],
] as const
export type BlendMode = (typeof BLEND_MODES)[number][0]

export const TWEET_THEMES = {
  light: { label: "Light", bg: "#FFFFFF", text: "#0F1419" },
  dim: { label: "Dim", bg: "#15202B", text: "#F7F9F9" },
  dark: { label: "Dark", bg: "#000000", text: "#E7E9EA" },
} as const
export type TweetThemeId = keyof typeof TWEET_THEMES

export const CARD_BG_COLORS = [
  "#FFFFFF",
  "#15202B",
  "#000000",
  "#FFF1F6",
  "#F1ECFF",
  "#E8FBF2",
  "#FFF8E0",
] as const

/** Pattern ink choices — "auto" (palette-derived) plus a flat set. */
export const PATTERN_COLORS = [
  "#0F1419",
  "#FFFFFF",
  "#FF6A57",
  "#F5A623",
  "#9BD14A",
  "#12B886",
  "#0FB5AE",
  "#3D7DF6",
  "#7C5CF6",
  "#E0449A",
] as const

export const CARD_TEXT_COLORS = [
  "#0F1419",
  "#F7F9F9",
  "#FF4F8B",
  "#6C5CE7",
  "#2FA36B",
  "#E5484D",
  "#8A6BFF",
] as const

/** Tweet avatar gradients — deterministic pick from the author's name */
export const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#A7C7FA,#D3C2FB)",
  "linear-gradient(135deg,#F9C9D8,#FBD9A6)",
  "linear-gradient(135deg,#A2E3C5,#D7EFAA)",
  "linear-gradient(135deg,#FCB7A3,#F494B0)",
  "linear-gradient(135deg,#93D2DE,#AABBF0)",
  "linear-gradient(135deg,#EEC9F9,#9F93F0)",
] as const

export const EXAMPLE_TWEETS = [
  "shipped the tiniest feature today.\n\nthe changelog is one line. the thank-you emails are ten. small is a growth strategy. #buildinpublic",
  "design tip nobody asked for:\n\ndelete the tooltip. write the label properly.",
  "your side project doesn't need a waitlist.\n\nit needs a share button and one good screenshot. like this one.",
] as const

/** Sliders: [label, min, max, suffix] */
export const SLIDERS = {
  fontSize: ["Text size", 12, 40, ""],
  width: ["Card width", 40, 100, "%"],
  radius: ["Roundness", 0, 48, ""],
  shadow: ["Shadow", 0, 100, ""],
  angle: ["Angle", 0, 360, "°"],
  intensity: ["Density", 0, 100, ""],
  rotation: ["Rotation", -180, 180, "°"],
  opacity: ["Opacity", 0, 100, "%"],
  blur: ["Softness", 0, 40, ""],
} as const
export type SliderKey = keyof typeof SLIDERS

/** Only the controls that actually change the selected finish are shown. */
export type PatternControl = "intensity" | "opacity" | "blur" | "rotation"
export const PATTERN_CONTROLS: Record<PatternId, readonly PatternControl[]> = {
  none: [],
  stripes: ["intensity", "rotation", "opacity", "blur"],
  maze: ["intensity", "rotation", "opacity", "blur"],
  isometric: ["intensity", "rotation", "opacity", "blur"],
  chevron: ["intensity", "rotation", "opacity", "blur"],
  faceted: ["intensity", "rotation", "opacity", "blur"],
  zigzag: ["intensity", "rotation", "opacity", "blur"],
}

export interface SnapState {
  tab: TabId
  /* post */
  text: string
  authorName: string
  authorHandle: string
  verified: boolean
  dateLabel: string
  avatarUrl: string | null
  stats: [string, string][]
  /** handle this post replies to, without the @ */
  replyTo: string | null
  /** attached photo, proxied same-origin so it survives export */
  mediaUrl: string | null
  mediaAspect: number | null
  /* canvas */
  size: CanvasSizeId
  bg: BgKind
  preset: number
  angle: number
  image: string | null /* object URL — memory only, never persisted */
  /* tweet appearance */
  fontSize: number
  width: number
  radius: number
  shadow: number
  cardBg: string
  cardText: string
  /* pattern */
  pattern: PatternId
  /** pattern ink override; null derives it from the palette */
  patternColor: string | null
  intensity: number
  rotation: number
  opacity: number
  blur: number
  blend: BlendMode
}

export function defaultDateLabel(now = new Date()): string {
  return formatDateLabel(now)
}

export const DEFAULT_STATE: SnapState = {
  tab: "tweet",
  text: EXAMPLE_TWEETS[0],
  authorName: "Nora Vale",
  authorHandle: "noravale",
  verified: true,
  dateLabel: "", // hydrated on mount — SSR must not bake in a timestamp
  avatarUrl: null,
  stats: [
    ["Replies", "128"],
    ["Reposts", "1.2K"],
    ["Likes", "8.4K"],
    ["Bookmarks", "96"],
    ["Views", "84.2K"],
  ],
  replyTo: null,
  mediaUrl: null,
  mediaAspect: null,
  size: "post",
  bg: "gradient",
  preset: 0,
  angle: 135,
  image: null,
  fontSize: 22,
  width: 84,
  radius: 26,
  shadow: 42,
  cardBg: TWEET_THEMES.light.bg,
  cardText: TWEET_THEMES.light.text,
  pattern: "isometric",
  patternColor: null,
  intensity: 44,
  rotation: 0,
  opacity: 100,
  blur: 0,
  blend: "normal",
}
