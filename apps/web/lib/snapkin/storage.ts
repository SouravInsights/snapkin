/* The canvas survives refreshes. This is the app's own data, not a hostile
 * input, so a shallow merge over the defaults is enough — the storage key is
 * versioned instead of validating every field. The only exception is `image`:
 * it's a blob URL scoped to this tab, so it can never be restored. */

import { DEFAULT_STATE, type SnapState } from "./config"

const STORAGE_KEY = "snapkin:v3"

export function loadState(): SnapState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (typeof saved !== "object" || saved === null) return null
    const state = { ...DEFAULT_STATE, ...saved, image: null } as SnapState
    // A malformed/legacy stats payload should never crash the card.
    if (!Array.isArray(state.stats)) state.stats = DEFAULT_STATE.stats
    return state
  } catch {
    return null
  }
}

let saveTimer: ReturnType<typeof setTimeout> | undefined

export function persistState(state: SnapState): void {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const { image: _image, ...rest } = state
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
    } catch {
      /* storage full or unavailable — the app still works */
    }
  }, 250)
}
