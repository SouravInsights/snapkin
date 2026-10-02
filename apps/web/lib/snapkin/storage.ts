/* localStorage persistence — the canvas survives refreshes, nothing leaves
 * the device. */

import { DEFAULT_STATE, type SnapState } from "./config"

const STORAGE_KEY = "snapkin:v2"

/** Keys that are session- or render-time only */
const EPHEMERAL: (keyof SnapState)[] = ["image", "dateLabel"]

export function loadState(): SnapState {
  const base: SnapState = {
    ...DEFAULT_STATE,
    dateLabel: DEFAULT_STATE.dateLabel,
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return base
    const stored: unknown = JSON.parse(raw)
    if (typeof stored !== "object" || stored === null) return base
    const merged = { ...base }
    for (const key of Object.keys(base) as (keyof SnapState)[]) {
      const value = (stored as Record<string, unknown>)[key]
      if (value !== undefined && typeof value === typeof base[key]) {
        ;(merged as Record<string, unknown>)[key] = value
      }
    }
    return merged
  } catch {
    return base
  }
}

let saveTimer: ReturnType<typeof setTimeout> | undefined

export function persistState(state: SnapState): void {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      const clean: Record<string, unknown> = { ...state }
      for (const key of EPHEMERAL) delete clean[key]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
    } catch {
      /* storage full or unavailable — the app still works */
    }
  }, 250)
}
