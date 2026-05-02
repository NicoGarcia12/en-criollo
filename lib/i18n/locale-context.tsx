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
      // Modo UI solo español: mantenemos lang fijo en "es".
      // Conservamos localStorage por compatibilidad hacia atrás con usuarios previos.
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        window.localStorage.setItem(STORAGE_KEY, "es")
      }
      setLocaleState("es")
      document.documentElement.lang = "es"
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

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider")
  return ctx
}
