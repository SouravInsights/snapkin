"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CopySimple, DownloadSimple } from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import {
  BG_PRESETS,
  DEFAULT_STATE,
  EXAMPLE_TWEETS,
  defaultDateLabel,
  type SnapState,
} from "@/lib/snapkin/config"
import { copyPng, exportPng } from "@/lib/snapkin/export"
import { importTweet } from "@/lib/snapkin/import-tweet"
import { loadState, persistState } from "@/lib/snapkin/storage"
import { CanvasPanel, PatternPanel, PostPanel, TweetPanel } from "./panels"
import { Sheet } from "./sheet"
import { Stage } from "./stage"
import { ThemeToggle } from "./theme-toggle"
import { Toast, type ToastData } from "./toast"

export function Snapkin() {
  const [state, setState] = useState<SnapState>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)
  const [busy, setBusy] = useState<"export" | "copy" | null>(null)
  const [importing, setImporting] = useState(false)
  const [exampleIndex, setExampleIndex] = useState(0)
  const [toastData, setToastData] = useState<ToastData | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  const objectUrl = useRef<string | null>(null)

  /* Hydrate from localStorage + stamp the live preview date (client only) */
  useEffect(() => {
    const stored = loadState()
    setState({ ...stored, dateLabel: stored.dateLabel || defaultDateLabel() })
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) persistState(state)
  }, [state, hydrated])

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current)
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    },
    []
  )

  const update = useCallback((patch: Partial<SnapState>) => {
    setState((s) => ({ ...s, ...patch }))
  }, [])

  const toast = useCallback((kind: ToastData["kind"], message: string) => {
    clearTimeout(toastTimer.current)
    setToastData({ id: Date.now(), kind, message })
    toastTimer.current = setTimeout(() => setToastData(null), 2600)
  }, [])

  /* Dim the sheet's other rows while a slider is being dragged */
  useEffect(() => {
    const clear = () => {
      document
        .querySelectorAll("[data-slot='sheet'][data-sliding]")
        .forEach((el) => delete (el as HTMLElement).dataset.sliding)
      document
        .querySelectorAll("[data-slot='slider-row'][data-sliding-row]")
        .forEach((el) => delete (el as HTMLElement).dataset.slidingRow)
    }
    const onDown = (e: Event) => {
      const sliderRow = (e.target as HTMLElement).closest?.(
        "[data-slot='slider-row']"
      ) as HTMLElement | null
      if (!sliderRow) return
      sliderRow.dataset.slidingRow = ""
      const sheet = sliderRow.closest(
        "[data-slot='sheet']"
      ) as HTMLElement | null
      if (sheet) sheet.dataset.sliding = ""
    }
    document.addEventListener("pointerdown", onDown)
    window.addEventListener("pointerup", clear)
    window.addEventListener("pointercancel", clear)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", clear)
      window.removeEventListener("pointercancel", clear)
    }
  }, [])

  /* --------------------------------------------------------- actions */

  const handleExport = async () => {
    const node = canvasRef.current
    if (!node || busy) return
    setBusy("export")
    try {
      await exportPng(node, state.size)
      toast("ok", "Saved as a crisp PNG")
    } catch {
      toast("err", "Export didn't work — try again")
    } finally {
      setBusy(null)
    }
  }

  const handleCopy = async () => {
    const node = canvasRef.current
    if (!node || busy) return
    setBusy("copy")
    try {
      await copyPng(node, state.size)
      toast("ok", "Copied — paste it anywhere")
    } catch {
      toast("err", "Copying images isn't supported here")
    } finally {
      setBusy(null)
    }
  }

  const handleImport = async (url: string) => {
    if (importing) return
    setImporting(true)
    try {
      const tweet = await importTweet(url)
      update({
        text: tweet.text,
        authorName: tweet.authorName,
        authorHandle: tweet.authorHandle,
        dateLabel: tweet.dateLabel || state.dateLabel,
      })
      toast("ok", "Post imported — make it yours")
    } catch (error) {
      toast(
        "err",
        error instanceof Error ? error.message : "Couldn't import that link"
      )
    } finally {
      setImporting(false)
    }
  }

  const handlePickImage = (file: File) => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    objectUrl.current = URL.createObjectURL(file)
    update({ image: objectUrl.current, bg: "image" })
    toast("ok", "Background image added")
  }

  const handleShuffle = () => {
    setState((s) => {
      let next = s.preset
      while (next === s.preset) {
        next = Math.floor(Math.random() * BG_PRESETS.length)
      }
      return { ...s, preset: next }
    })
  }

  const handleExchangeExample = () => {
    const next = (exampleIndex + 1) % EXAMPLE_TWEETS.length
    setExampleIndex(next)
    update({ text: EXAMPLE_TWEETS[next] })
  }

  /* --------------------------------------------------------- render */

  return (
    <div className="grid h-dvh grid-rows-[52px_minmax(0,1fr)_auto] bg-background pt-[env(safe-area-inset-top,0px)] text-foreground lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[60px_minmax(0,1fr)]">
      <header className="flex items-center justify-between border-b border-border px-4 lg:col-span-full lg:px-6">
        <div className="font-heading text-xl font-bold tracking-tight">
          snapkin
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="size-10"
            aria-label="Copy image to clipboard"
            disabled={busy !== null || !hydrated}
            onClick={handleCopy}
          >
            <CopySimple size={20} aria-hidden />
          </Button>
          <Button
            size="lg"
            className="ml-1 h-10 gap-1.5 px-4 text-sm font-semibold"
            disabled={busy !== null || !hydrated}
            onClick={handleExport}
          >
            <DownloadSimple size={16} weight="bold" aria-hidden />
            {busy === "export" ? "Exporting…" : "Export"}
          </Button>
        </div>
      </header>

      <Stage state={state} ref={canvasRef} />

      <Sheet tab={state.tab} onTab={(tab) => update({ tab })}>
        {state.tab === "post" && (
          <PostPanel
            state={state}
            update={update}
            onImport={handleImport}
            importing={importing}
            exampleIndex={exampleIndex}
            onExchange={handleExchangeExample}
          />
        )}
        {state.tab === "tweet" && <TweetPanel state={state} update={update} />}
        {state.tab === "canvas" && (
          <CanvasPanel
            state={state}
            update={update}
            onPickImage={handlePickImage}
            onShuffle={handleShuffle}
          />
        )}
        {state.tab === "pattern" && (
          <PatternPanel state={state} update={update} />
        )}
      </Sheet>

      <Toast data={toastData} />
    </div>
  )
}
