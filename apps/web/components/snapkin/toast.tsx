"use client"

import { useEffect, useState } from "react"
import { CheckCircle, WarningCircle } from "@phosphor-icons/react"
import { cn } from "@workspace/ui/lib/utils"

export interface ToastData {
  id: number
  kind: "ok" | "err"
  message: string
}

export function Toast({ data }: { data: ToastData | null }) {
  const [rendered, setRendered] = useState<ToastData | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (data) {
      setRendered(data)
      const raf = requestAnimationFrame(() => setShow(true))
      return () => cancelAnimationFrame(raf)
    }
    setShow(false)
    const timer = setTimeout(() => setRendered(null), 260)
    return () => clearTimeout(timer)
  }, [data])

  if (!rendered) return null

  const Icon = rendered.kind === "ok" ? CheckCircle : WarningCircle

  return (
    <div
      data-slot="toast"
      role="status"
      className={cn(
        "pointer-events-none fixed top-[calc(64px+env(safe-area-inset-top,0px))] left-1/2 z-50 flex min-h-10 max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-2 items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-center text-[13px] font-medium text-background opacity-0 shadow-lg transition-[opacity,transform] duration-200 motion-reduce:transition-none",
        show && "translate-y-0 opacity-100"
      )}
    >
      <Icon
        size={18}
        weight="fill"
        aria-hidden
        className={cn(
          "shrink-0",
          rendered.kind === "err" && "text-destructive-foreground"
        )}
      />
      {rendered.message}
    </div>
  )
}
