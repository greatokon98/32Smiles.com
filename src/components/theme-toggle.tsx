"use client"

import { useState, useEffect } from "react"
import { Sun, Moon, Monitor } from "lucide-react"

type Theme = "light" | "dark" | "system"

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const resolved = theme === "system" ? getSystemTheme() : theme

  if (resolved === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = (localStorage.getItem("theme") as Theme) || "system"
    setTheme(saved)
    applyTheme(saved)

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (saved === "system") {
        applyTheme("system")
      }
    }
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  function cycleTheme() {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
    setTheme(next)
    localStorage.setItem("theme", next)
    applyTheme(next)
  }

  if (!mounted) {
    return (
      <button className="p-2 text-gray-400 rounded-lg" aria-label="Toggle theme">
        <Monitor className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      onClick={cycleTheme}
      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label={`Current theme: ${theme}. Click to cycle.`}
      title={`Theme: ${theme}`}
    >
      {theme === "light" && <Sun className="h-5 w-5" />}
      {theme === "dark" && <Moon className="h-5 w-5" />}
      {theme === "system" && <Monitor className="h-5 w-5" />}
    </button>
  )
}