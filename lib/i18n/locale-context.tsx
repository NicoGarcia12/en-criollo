"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { type Locale, t as translate, type DictKey } from "./dictionary"

const STORAGE_KEY = "encriollo:locale"

type Ctx = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: DictKey, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<Ctx | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es")

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null
      if (stored === "es" || stored === "en") {
        setLocaleState(stored)
        document.documentElement.lang = stored
        return
      }
      // First visit: detect from navigator
      const nav = (navigator.language || "es").toLowerCase()
      const detected: Locale = nav.startsWith("en") ? "en" : "es"
      setLocaleState(detected)
      document.documentElement.lang = detected
    } catch {
      // ignore
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      window.localStorage.setItem(STORAGE_KEY, l)
      document.documentElement.lang = l
    } catch {
      // ignore
    }
  }, [])

  const t = useCallback(
    (key: DictKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  )

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider")
  return ctx
}
