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
  ["wave", "Wave"],
  ["image", "Image"],
] as const
export type BgKind = (typeof BG_KINDS)[number][0]

/** Background palettes: [name, base, mid, pop] */
export const BG_PRESETS = [
  ["Paper", "#F4EFE6", "#E7DCC8", "#FBD8B4"],
  ["Blush", "#FFE7EC", "#FFC9D3", "#FFF3DC"],
  ["Tide", "#DDEFF0", "#A9D6DA", "#DBF1E4"],
  ["Meadow", "#E4F3DB", "#B9E0B9", "#F6F6CE"],
  ["Sunset", "#FFE2D4", "#FFB494", "#FFF1C8"],
  ["Grape", "#EEE5FA", "#CDBAF0", "#FBDBED"],
  ["Citrus", "#FFF3C6", "#F8DF77", "#E2F0CB"],
  ["Storm", "#2E323B", "#1A1D24", "#5B6478"],
] as const

export const PATTERNS = [
  ["none", "None"],
  ["dots", "Dots"],
  ["grid", "Grid"],
  ["waves", "Waves"],
  ["diagonal", "Diagonal"],
  ["cross", "Cross"],
] as const
export type PatternId = (typeof PATTERNS)[number][0]

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
  fontSize: ["Font size", 12, 40, ""],
  scale: ["Tweet size", 60, 140, "%"],
  width: ["Tweet width", 40, 100, "%"],
  radius: ["Roundness", 0, 48, ""],
  shadow: ["Shadow", 0, 100, ""],
  angle: ["Angle", 0, 360, "°"],
  intensity: ["Intensity", 0, 100, ""],
  rotation: ["Rotation", -180, 180, "°"],
  opacity: ["Opacity", 0, 100, "%"],
  blur: ["Blur", 0, 40, ""],
} as const
export type SliderKey = keyof typeof SLIDERS

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
  /* canvas */
  size: CanvasSizeId
  bg: BgKind
  preset: number
  angle: number
  image: string | null /* object URL — memory only, never persisted */
  /* tweet appearance */
  fontSize: number
  scale: number
  width: number
  radius: number
  shadow: number
  cardBg: string
  cardText: string
  /* pattern */
  pattern: PatternId
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
    ["Reposts", "1.2K"],
    ["Likes", "8.4K"],
    ["Bookmarks", "96"],
  ],
  size: "post",
  bg: "gradient",
  preset: 0,
  angle: 135,
  image: null,
  fontSize: 22,
  scale: 100,
  width: 84,
  radius: 26,
  shadow: 42,
  cardBg: TWEET_THEMES.light.bg,
  cardText: TWEET_THEMES.light.text,
  pattern: "dots",
  intensity: 40,
  rotation: 0,
  opacity: 32,
  blur: 0,
  blend: "normal",
}
