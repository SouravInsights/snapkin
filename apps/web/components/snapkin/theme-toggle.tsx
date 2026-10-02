"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "@phosphor-icons/react"
import { useTheme } from "next-themes"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const dark = mounted && resolvedTheme === "dark"

  const iconClass =
    "absolute transition-[opacity,scale,filter] duration-200 motion-reduce:transition-none data-[off]:scale-50 data-[off]:opacity-0 data-[off]:blur-xs"

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="relative size-10"
    >
      <Sun
        size={20}
        aria-hidden
        data-off={dark || undefined}
        className={iconClass}
      />
      <Moon
        size={20}
        aria-hidden
        data-off={!dark || undefined}
        className={iconClass}
      />
    </Button>
  )
}
