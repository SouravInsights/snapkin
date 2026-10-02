"use client"

import { useRef } from "react"
import { LinkSimple, Plus, Shuffle } from "@phosphor-icons/react"
import {
  BG_KINDS,
  BG_PRESETS,
  BLEND_MODES,
  CANVAS_SIZES,
  CARD_BG_COLORS,
  CARD_TEXT_COLORS,
  DEFAULT_STATE,
  EXAMPLE_TWEETS,
  PATTERNS,
  TWEET_THEMES,
  type CanvasSizeId,
  type SnapState,
  type TweetThemeId,
} from "@/lib/snapkin/config"
import { backgroundCss, presetAt } from "@/lib/snapkin/derive"
import { cn } from "@workspace/ui/lib/utils"
import {
  ChipRow,
  GroupLabel,
  SliderRow,
  SwatchRow,
  useFinePointer,
} from "./fields"

export interface PanelProps {
  state: SnapState
  update: (patch: Partial<SnapState>) => void
}

const inputShell = cn(
  "flex h-11 items-center gap-2 rounded-lg bg-background px-3 text-muted-foreground ring-1 ring-input transition-shadow",
  "focus-within:ring-2 focus-within:ring-ring/50"
)

const fieldInput =
  "min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"

const ghostButton = cn(
  "h-8 touch-manipulation rounded-md px-3 text-[13px] font-medium text-muted-foreground transition-[background-color,transform,color] duration-150",
  "hover:bg-muted hover:text-foreground active:scale-95"
)

/* ------------------------------------------------------------------ post */

export function PostPanel({
  state,
  update,
  onImport,
  importing,
  exampleIndex,
  onExchange,
}: PanelProps & {
  onImport: (url: string) => void
  importing: boolean
  exampleIndex: number
  onExchange: () => void
}) {
  const linkRef = useRef<HTMLInputElement>(null)

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (linkRef.current) {
        linkRef.current.value = text
        linkRef.current.focus()
      }
    } catch {
      linkRef.current?.focus()
    }
  }

  const submit = () => {
    const value = linkRef.current?.value ?? ""
    if (value.trim()) onImport(value)
  }

  return (
    <div
      data-slot="panel"
      className="[&>*]:transition-opacity group-data-[sliding]/sheet:[&>:not([data-sliding-row])]:opacity-40"
    >
      <div className={cn(inputShell, "mt-1.5 pr-1.5")}>
        <LinkSimple size={18} aria-hidden className="shrink-0" />
        <input
          ref={linkRef}
          placeholder="Paste a post link"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Post link"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className={fieldInput}
        />
        <button
          type="button"
          onClick={paste}
          className={cn(ghostButton, "shrink-0")}
        >
          Paste
        </button>
        <button
          type="button"
          aria-disabled={importing}
          onClick={submit}
          className={cn(
            "h-8 shrink-0 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground transition-[transform,opacity] duration-150 active:scale-95",
            importing && "pointer-events-none opacity-60"
          )}
        >
          {importing ? "Loading…" : "Import"}
        </button>
      </div>

      <GroupLabel>Author</GroupLabel>
      <div className="grid gap-2">
        <div className={inputShell}>
          <input
            value={state.authorName}
            aria-label="Author name"
            placeholder="Display name"
            maxLength={40}
            onChange={(e) => update({ authorName: e.target.value })}
            className={fieldInput}
          />
        </div>
        <div className={inputShell}>
          <span aria-hidden className="shrink-0">
            @
          </span>
          <input
            value={state.authorHandle}
            aria-label="Author handle"
            placeholder="handle"
            maxLength={24}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) =>
              update({
                authorHandle: e.target.value.replace(/^@+/, ""),
                // a changed identity must not keep someone else's photo
                avatarUrl: null,
              })
            }
            className={fieldInput}
          />
        </div>
      </div>

      <GroupLabel
        action={
          <span className="tabular-nums" aria-live="off">
            {state.text.length}
          </span>
        }
      >
        Text
      </GroupLabel>
      <textarea
        value={state.text}
        aria-label="Post text"
        placeholder="Write something worth screenshotting…"
        onChange={(e) => update({ text: e.target.value })}
        className="min-h-24 w-full resize-none rounded-lg bg-background px-3 py-3 text-base leading-[1.45] text-foreground ring-1 ring-input transition-shadow outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/50"
      />
      <div className="mt-2 flex gap-1">
        <button
          type="button"
          className={ghostButton}
          onClick={() => update({ text: "" })}
        >
          Write your own
        </button>
        <button type="button" className={ghostButton} onClick={onExchange}>
          Try an example {exampleIndex + 1}/{EXAMPLE_TWEETS.length}
        </button>
      </div>

      <p className="mt-4 text-xs leading-4 text-pretty text-muted-foreground">
        Everything stays on your device — posts are composed and exported
        locally, nothing is uploaded.
      </p>
    </div>
  )
}

/* ----------------------------------------------------------------- tweet */

function currentTheme(state: SnapState): TweetThemeId | undefined {
  return (Object.keys(TWEET_THEMES) as TweetThemeId[]).find(
    (key) =>
      TWEET_THEMES[key].bg === state.cardBg &&
      TWEET_THEMES[key].text === state.cardText
  )
}

export function TweetPanel({ state, update }: PanelProps) {
  const finePointer = useFinePointer()
  return (
    <div
      data-slot="panel"
      className="[&>*]:transition-opacity group-data-[sliding]/sheet:[&>:not([data-sliding-row])]:opacity-40"
    >
      <div className="mt-1">
        <ChipRow
          label="Theme"
          items={(Object.keys(TWEET_THEMES) as TweetThemeId[]).map(
            (key) => [key, TWEET_THEMES[key].label] as const
          )}
          current={currentTheme(state)}
          onSelect={(theme) =>
            update({
              cardBg: TWEET_THEMES[theme].bg,
              cardText: TWEET_THEMES[theme].text,
            })
          }
        />
      </div>

      {(["fontSize", "width", "radius", "shadow"] as const).map((key) => (
        <SliderRow
          key={key}
          id={key}
          value={state[key]}
          defaultValue={DEFAULT_STATE[key]}
          onChange={(value) => update({ [key]: value })}
        />
      ))}

      <GroupLabel>Background</GroupLabel>
      <SwatchRow
        label="Card background"
        colors={CARD_BG_COLORS}
        current={state.cardBg}
        onSelect={(cardBg) => update({ cardBg })}
      />

      <GroupLabel>Text color</GroupLabel>
      <SwatchRow
        label="Card text color"
        colors={CARD_TEXT_COLORS}
        current={state.cardText}
        onSelect={(cardText) => update({ cardText })}
      />

      {finePointer && (
        <p className="mt-4 text-xs leading-4 text-pretty text-muted-foreground">
          Double-click any slider to reset it.
        </p>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- canvas */

const SIZE_IDS = Object.keys(CANVAS_SIZES) as CanvasSizeId[]

export function CanvasPanel({
  state,
  update,
  onPickImage,
  onShuffle,
}: PanelProps & {
  onPickImage: (file: File) => void
  onShuffle: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const sizeIndex = SIZE_IDS.indexOf(state.size)

  return (
    <div
      data-slot="panel"
      className="[&>*]:transition-opacity group-data-[sliding]/sheet:[&>:not([data-sliding-row])]:opacity-40"
    >
      <div
        role="group"
        aria-label="Canvas size"
        className="relative mt-1.5 grid h-[62px] grid-cols-3 rounded-lg bg-muted p-[3px]"
      >
        {SIZE_IDS.map((id) => {
          const size = CANVAS_SIZES[id]
          const active = id === state.size
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => update({ size: id })}
              className="relative z-10 flex touch-manipulation flex-col items-center justify-center gap-1.5 rounded-md text-[11px] font-medium text-muted-foreground transition-colors duration-150 aria-pressed:text-foreground"
            >
              <span
                className="rounded-[3px] border-[1.5px] border-current"
                style={{ width: size.rect[0], height: size.rect[1] }}
                aria-hidden
              />
              {size.label}
            </button>
          )
        })}
        <span
          aria-hidden
          className="absolute inset-y-[3px] left-[3px] w-[calc((100%-6px)/3)] rounded-md bg-card shadow-sm ring-1 ring-border transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.4,0.5,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(${sizeIndex * 100}%)` }}
        />
      </div>

      <GroupLabel>Background</GroupLabel>
      <div className="grid grid-cols-5 gap-2 py-1">
        {BG_KINDS.map(([kind, label]) => {
          const active = kind === state.bg
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={active}
              onClick={() => {
                if (kind === "image" && !state.image) {
                  fileRef.current?.click()
                  return
                }
                update({ bg: kind })
              }}
              className={cn(
                "group flex touch-manipulation flex-col items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors",
                "aria-pressed:text-foreground"
              )}
            >
              {kind === "image" && !state.image ? (
                <span
                  aria-hidden
                  className="grid h-12 w-full place-items-center rounded-lg bg-muted shadow-[inset_0_0_0_1px_var(--border)] transition-[box-shadow,transform] duration-150 group-active:scale-95"
                >
                  <Plus size={18} weight="bold" />
                </span>
              ) : (
                <span
                  aria-hidden
                  style={backgroundCss(
                    kind,
                    state.preset,
                    state.angle,
                    state.image
                  )}
                  className={cn(
                    "h-12 w-full rounded-lg bg-muted bg-cover bg-center transition-[box-shadow,transform] duration-150 group-active:scale-95",
                    active
                      ? "shadow-[0_0_0_2px_var(--card),0_0_0_4px_var(--foreground)]"
                      : "shadow-[inset_0_0_0_1px_var(--border)]"
                  )}
                />
              )}
              {label}
            </button>
          )
        })}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onPickImage(file)
          e.target.value = ""
        }}
      />
      {state.bg === "image" && state.image && (
        <div className="mt-1 flex gap-1">
          <button
            type="button"
            className={ghostButton}
            onClick={() => fileRef.current?.click()}
          >
            Replace image
          </button>
          <button
            type="button"
            className={ghostButton}
            onClick={() => update({ image: null, bg: "gradient" })}
          >
            Remove
          </button>
        </div>
      )}

      <GroupLabel
        action={
          <button
            type="button"
            onClick={onShuffle}
            className="flex h-7 items-center gap-1 rounded-md bg-secondary px-2.5 text-[11px] font-medium tracking-normal text-secondary-foreground normal-case transition-transform duration-150 active:scale-95"
          >
            <Shuffle size={13} weight="bold" aria-hidden /> Shuffle
          </button>
        }
      >
        Presets
      </GroupLabel>
      <SwatchRow
        label="Background presets"
        colors={BG_PRESETS.map((p) => p[0])}
        current={presetAt(state.preset)[0]}
        preview={(name) => {
          const preset = BG_PRESETS.find((p) => p[0] === name)
          return `linear-gradient(135deg, ${preset?.[1]}, ${preset?.[2]})`
        }}
        onSelect={(name) =>
          update({ preset: BG_PRESETS.findIndex((p) => p[0] === name) })
        }
      />

      {state.bg === "gradient" && (
        <div className="mt-1">
          <SliderRow
            id="angle"
            value={state.angle}
            defaultValue={DEFAULT_STATE.angle}
            onChange={(angle) => update({ angle })}
          />
        </div>
      )}

      <p className="mt-4 text-xs leading-4 text-pretty text-muted-foreground">
        Exports at{" "}
        <span className="tabular-nums">
          {CANVAS_SIZES[state.size].out.join(" × ")}px
        </span>{" "}
        — crisp on every feed.
      </p>
    </div>
  )
}

/* --------------------------------------------------------------- pattern */

export function PatternPanel({ state, update }: PanelProps) {
  return (
    <div
      data-slot="panel"
      className="[&>*]:transition-opacity group-data-[sliding]/sheet:[&>:not([data-sliding-row])]:opacity-40"
    >
      <div className="mt-1">
        <ChipRow
          label="Pattern"
          items={PATTERNS}
          current={state.pattern}
          onSelect={(pattern) => update({ pattern })}
        />
      </div>

      {state.pattern !== "none" && (
        <>
          {(["intensity", "rotation", "opacity", "blur"] as const).map(
            (key) => (
              <SliderRow
                key={key}
                id={key}
                value={state[key]}
                defaultValue={DEFAULT_STATE[key]}
                onChange={(value) => update({ [key]: value })}
              />
            )
          )}
          <GroupLabel>Blend</GroupLabel>
          <ChipRow
            label="Blend mode"
            items={BLEND_MODES}
            current={state.blend}
            onSelect={(blend) => update({ blend })}
          />
        </>
      )}

      {state.pattern === "none" && (
        <p className="mt-4 text-xs leading-4 text-pretty text-muted-foreground">
          Patterns sit between the background and the post — subtle texture, big
          difference.
        </p>
      )}
    </div>
  )
}
