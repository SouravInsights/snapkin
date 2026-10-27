"use client"

import { useSyncExternalStore, type CSSProperties, type ReactNode } from "react"
import {
  PATTERN_DEFAULTS,
  PATTERNS,
  SLIDERS,
  type BgKind,
  type PatternId,
  type SliderKey,
} from "@/lib/snapkin/config"
import {
  backgroundCss,
  patternCss,
  presetAt,
  type BgPreset,
} from "@/lib/snapkin/derive"
import { cn } from "@workspace/ui/lib/utils"

/** True on devices with a precise pointer (mouse/trackpad). SSR-safe. */
export function useFinePointer(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(hover: hover) and (pointer: fine)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    () => false
  )
}

export function GroupLabel({
  children,
  action,
}: {
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mt-5 mb-2 flex items-center justify-between text-[11px] leading-4 font-medium tracking-wider text-muted-foreground uppercase first:mt-1.5">
      <span>{children}</span>
      {action}
    </div>
  )
}

const fillPercent = (value: number, min: number, max: number) =>
  `calc(${((value - min) / (max - min)).toFixed(4)} * (100% - 22px) + 11px)`

/** Label + range + tabular output. Double-click the row to reset. */
export function SliderRow({
  id,
  value,
  defaultValue,
  onChange,
}: {
  id: SliderKey
  value: number
  defaultValue: number
  onChange: (value: number) => void
}) {
  const [label, min, max, suffix] = SLIDERS[id]
  // Double-tap fires dblclick on touch screens too — scrolling past sliders
  // would silently reset them. The gesture stays a desktop affordance.
  const finePointer = useFinePointer()
  return (
    <div
      data-slot="slider-row"
      className="grid min-h-[42px] grid-cols-[88px_1fr_46px] items-center gap-3"
      onDoubleClick={() => finePointer && onChange(defaultValue)}
      title={
        finePointer ? `Double-click to reset ${label.toLowerCase()}` : undefined
      }
    >
      <span
        id={`${id}-label`}
        className="text-[13px] leading-[18px] font-medium whitespace-nowrap text-muted-foreground"
      >
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-labelledby={`${id}-label`}
        style={{ "--p": fillPercent(value, min, max) } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "h-11 w-full cursor-pointer touch-pan-y appearance-none bg-transparent",
          "[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(90deg,var(--primary)_var(--p),var(--secondary)_var(--p))]",
          "[&::-webkit-slider-thumb]:mt-[-9px] [&::-webkit-slider-thumb]:size-[22px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-card [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:ring-1 [&::-webkit-slider-thumb]:ring-input [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150",
          "active:[&::-webkit-slider-thumb]:scale-115",
          "[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-secondary",
          "[&::-moz-range-progress]:h-1 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-primary",
          "[&::-moz-range-thumb]:size-[22px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-card [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:ring-1 [&::-moz-range-thumb]:ring-input"
        )}
      />
      <output
        aria-hidden
        className="text-right text-[13px] leading-[18px] font-medium whitespace-nowrap tabular-nums"
      >
        {value}
        {suffix}
      </output>
    </div>
  )
}

export function PresetGrid({
  presets,
  current,
  kind,
  angle,
  onSelect,
}: {
  presets: readonly BgPreset[]
  current: string
  kind: BgKind
  angle: number
  onSelect: (name: string) => void
}) {
  // Palette swatches preview the background kind the user is actually in, so
  // picking a family shows its real gradient/mesh/halo, not a generic chip.
  const previewKind: BgKind = kind === "image" ? "gradient" : kind
  return (
    <div className="-mx-1 space-y-4">
      {(["light", "dark", "flat"] as const).map((tone) => {
        const items = presets.filter((preset) => preset[4] === tone)
        if (items.length === 0) return null
        const toneLabel =
          tone === "light" ? "Light" : tone === "dark" ? "Dark" : "Flat"
        return (
          <div key={tone} role="group" aria-label={`${toneLabel} palettes`}>
            <div className="mb-2 flex items-center gap-2 px-1 text-[10px] leading-none font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {toneLabel}
              <span aria-hidden className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {items.map((preset) => {
                const [name] = preset
                const active = name === current
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onSelect(name)}
                    className="group flex touch-manipulation flex-col gap-1.5 rounded-lg p-1 text-left transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.97]"
                  >
                    <span
                      aria-hidden
                      style={backgroundCss(
                        previewKind,
                        presets.indexOf(preset),
                        angle,
                        null
                      )}
                      className={cn(
                        "h-12 w-full rounded-md transition-shadow duration-150",
                        active
                          ? "shadow-[inset_0_0_0_1px_var(--input),0_0_0_2px_var(--card),0_0_0_4px_var(--foreground)]"
                          : "shadow-[inset_0_0_0_1px_var(--border)] group-hover:shadow-[inset_0_0_0_1px_var(--input)]"
                      )}
                    />
                    <span
                      className={cn(
                        "truncate text-[11px] leading-4 tracking-[-0.005em] transition-colors",
                        active
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Pattern picker — a grid of live previews instead of names. */
export function PatternGrid({
  presetIndex,
  current,
  color,
  onSelect,
}: {
  presetIndex: number
  current: PatternId
  color: string | null
  onSelect: (id: PatternId) => void
}) {
  const [, base, mid] = presetAt(presetIndex)
  return (
    <div role="group" aria-label="Pattern" className="grid grid-cols-4 gap-2">
      {PATTERNS.map(([id, label]) => {
        const active = id === current
        const defaults = PATTERN_DEFAULTS[id]
        const pattern = patternCss(
          id,
          {
            intensity: defaults.intensity ?? 44,
            rotation: defaults.rotation ?? 0,
            opacity: defaults.opacity ?? 26,
            blur: defaults.blur ?? 0,
            blend: "normal",
            presetIndex,
            color,
          },
          (n) => `${Math.round(n * 0.25 * 100) / 100}px`
        )
        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-pressed={active}
            onClick={() => onSelect(id)}
            style={{ background: `linear-gradient(135deg, ${base}, ${mid})` }}
            className="group relative aspect-square touch-manipulation overflow-hidden rounded-lg transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.97]"
          >
            {pattern && (
              <span aria-hidden className="absolute inset-0" style={pattern} />
            )}
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 rounded-lg transition-shadow duration-150",
                active
                  ? "shadow-[inset_0_0_0_2px_var(--foreground)]"
                  : "shadow-[inset_0_0_0_1px_var(--border)] group-hover:shadow-[inset_0_0_0_1px_var(--input)]"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

export function ChipRow<T extends string>({
  items,
  current,
  onSelect,
  label,
}: {
  items: readonly (readonly [T, string])[]
  current: T | undefined
  onSelect: (value: T) => void
  label: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map(([value, itemLabel]) => {
        const active = value === current
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(value)}
            className={cn(
              "min-h-8 shrink-0 touch-manipulation rounded-full bg-card px-3 text-[13px] font-medium text-muted-foreground shadow-[inset_0_0_0_1px_var(--input)]",
              "transition-[box-shadow,background-color,color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95",
              "aria-pressed:bg-secondary aria-pressed:text-foreground aria-pressed:shadow-[inset_0_0_0_1.5px_var(--foreground)]"
            )}
          >
            {itemLabel}
          </button>
        )
      })}
    </div>
  )
}

export function SwatchRow({
  colors,
  current,
  onSelect,
  label,
  preview,
}: {
  colors: readonly string[]
  current: string
  onSelect: (value: string) => void
  label: string
  /** custom CSS for each swatch's background; defaults to the raw color */
  preview?: (color: string) => string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-4 flex gap-2.5 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {colors.map((color) => {
        const active = color === current
        return (
          <button
            key={color}
            type="button"
            aria-label={color}
            aria-pressed={active}
            style={{ background: preview ? preview(color) : color }}
            onClick={() => onSelect(color)}
            className={cn(
              "size-8 shrink-0 touch-manipulation rounded-full shadow-[inset_0_0_0_1px_var(--input)]",
              "transition-[box-shadow,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-90",
              "aria-pressed:shadow-[inset_0_0_0_1px_var(--input),0_0_0_2px_var(--card),0_0_0_4px_var(--foreground)]"
            )}
          />
        )
      })}
    </div>
  )
}
