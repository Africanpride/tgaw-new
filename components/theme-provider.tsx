"use client"

import * as React from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("theme") as Theme | null
    const initial = stored ?? "system"
    setThemeState(initial)
    applyTheme(initial)
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyTheme(theme)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [theme, mounted])

  React.useEffect(() => {
    if (!mounted) return
    function isTypingTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false
      return target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT"
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key.toLowerCase() !== "d") return
      if (isTypingTarget(e.target)) return
      setThemeState((prev) => {
        const next = resolvedTheme === "dark" ? "light" : "dark"
        localStorage.setItem("theme", next)
        applyTheme(next)
        return next
      })
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [mounted, resolvedTheme])

  function applyTheme(t: Theme) {
    const resolved = t === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : t
    setResolvedTheme(resolved)
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(resolved)
    root.style.colorScheme = resolved
  }

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem("theme", t)
    applyTheme(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) {
    return { theme: "system" as Theme, resolvedTheme: "light" as const, setTheme: () => {} }
  }
  return ctx
}

export { ThemeProvider, useTheme }
