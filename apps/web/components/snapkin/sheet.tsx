"use client"

import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import {
  Article,
  CirclesFour,
  ImageSquare,
  TwitterLogo,
} from "@phosphor-icons/react"
import { TABS, type TabId } from "@/lib/snapkin/config"
import { cn } from "@workspace/ui/lib/utils"

const TAB_META: Record<TabId, { label: string; icon: typeof Article }> = {
  post: { label: "Post", icon: Article },
  tweet: { label: "Tweet", icon: TwitterLogo },
  canvas: { label: "Canvas", icon: ImageSquare },
  pattern: { label: "Pattern", icon: CirclesFour },
}

const PEEK_PX = 80
const expandedHeight = () => Math.min(0.45 * window.innerHeight, 402)
const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches

interface DragSession {
  pointerId: number
  startY: number
  baseHeight: number
  lastY: number
  lastT: number
  velocity: number // px/ms, positive = dragging upward
  moved: boolean
}

/** Mobile bottom sheet with drag handle + tab bar; static panel on desktop. */
export function Sheet({
  tab,
  onTab,
  children,
}: {
  tab: TabId
  onTab: (tab: TabId) => void
  children: ReactNode
}) {
  const [peek, setPeek] = useState(false)
  const sheetRef = useRef<HTMLElement>(null)
  const drag = useRef<DragSession | null>(null)

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isDesktop() || !e.isPrimary || !sheetRef.current) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      baseHeight: sheetRef.current.offsetHeight,
      lastY: e.clientY,
      lastT: e.timeStamp,
      velocity: 0,
      moved: false,
    }
    sheetRef.current.dataset.dragging = ""
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId || !sheetRef.current) return
    const dy = e.clientY - d.startY
    if (Math.abs(dy) > 3) d.moved = true
    const clamped = Math.min(
      expandedHeight(),
      Math.max(PEEK_PX, d.baseHeight - dy)
    )
    sheetRef.current.style.height = `${clamped}px`
    const dt = e.timeStamp - d.lastT
    if (dt > 0) d.velocity = (d.lastY - e.clientY) / dt
    d.lastY = e.clientY
    d.lastT = e.timeStamp
  }

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId || !sheetRef.current) return
    drag.current = null
    const sheet = sheetRef.current
    delete sheet.dataset.dragging
    sheet.style.height = ""
    if (!d.moved) {
      setPeek((p) => !p)
      return
    }
    const midpoint = (expandedHeight() + PEEK_PX) / 2
    const height = sheet.offsetHeight
    // A flick always wins; otherwise settle on the nearest resting point
    const shouldPeek =
      d.velocity < -0.3 || (Math.abs(d.velocity) <= 0.3 && height < midpoint)
    setPeek(shouldPeek)
  }

  return (
    <section
      ref={sheetRef}
      data-slot="sheet"
      data-peek={peek || undefined}
      aria-label="Controls"
      className={cn(
        "group/sheet relative flex h-[min(45dvh,402px)] min-h-0 flex-col overflow-hidden rounded-t-4xl border-t border-sidebar-border bg-card pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-12px_40px_-16px_rgb(0_0_0/0.18)]",
        "transition-[height] duration-300 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] data-[dragging]:transition-none data-[peek]:h-[calc(80px+env(safe-area-inset-bottom,0px))]",
        "motion-reduce:transition-none",
        "lg:h-auto lg:rounded-none lg:border-t-0 lg:border-l lg:bg-sidebar lg:pb-0 lg:shadow-none"
      )}
    >
      <div
        data-slot="sheet-handle"
        role="button"
        tabIndex={0}
        aria-label={peek ? "Expand controls" : "Collapse controls"}
        aria-expanded={!peek}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowUp") {
            e.preventDefault()
            setPeek(false)
          } else if (e.key === "ArrowDown") {
            e.preventDefault()
            setPeek(true)
          }
        }}
        className="grid h-6 w-full cursor-grab touch-none place-items-center lg:hidden"
      >
        <span className="h-1 w-9 rounded-full bg-input" />
      </div>

      <nav
        role="tablist"
        aria-label="Editing sections"
        className="relative grid h-14 shrink-0 grid-cols-4 border-t border-sidebar-border lg:h-[60px] lg:border-t-0 lg:border-b"
      >
        {TABS.map((id) => {
          const { label, icon: Icon } = TAB_META[id]
          const active = id === tab
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              data-slot="sheet-tab"
              aria-controls="controls-panel"
              aria-selected={active}
              onClick={() => {
                onTab(id)
                setPeek(false)
              }}
              className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors duration-150 aria-selected:text-foreground"
            >
              <Icon
                size={20}
                weight={active ? "fill" : "regular"}
                aria-hidden
                className="transition-colors duration-150"
              />
              {label}
            </button>
          )
        })}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 flex h-[3px] w-1/4 justify-center transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.4,0.5,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(${TABS.indexOf(tab) * 100}%)` }}
        >
          <span className="h-[3px] w-6 rounded-full bg-primary" />
        </span>
      </nav>

      <div
        role="tabpanel"
        id="controls-panel"
        aria-labelledby={`tab-${tab}`}
        data-slot="controls-panel"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-1.5 pb-6 [scrollbar-width:thin]"
      >
        {children}
      </div>
    </section>
  )
}
