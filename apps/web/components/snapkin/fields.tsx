"use client"

import { useSyncExternalStore, type CSSProperties, type ReactNode } from "react"
import { SLIDERS, type SliderKey } from "@/lib/snapkin/config"
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
              "transition-[box-shadow,background-color,color,transform] duration-150 active:scale-95",
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
              "transition-[box-shadow,transform] duration-150 active:scale-90",
              "aria-pressed:shadow-[inset_0_0_0_1px_var(--input),0_0_0_2px_var(--card),0_0_0_4px_var(--foreground)]"
            )}
          />
        )
      })}
    </div>
  )
}
