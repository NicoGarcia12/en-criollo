"use client"

import { useCallback, useEffect, useState } from "react"
import type { HistoryEntry, UnifiedOutput } from "./types"

const STORAGE_KEY = "encriollo:history:v2"
const MAX_ITEMS = 5

function readStorage(): HistoryEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, MAX_ITEMS)
  } catch {
    return []
  }
}

function writeStorage(items: HistoryEntry[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
  } catch {
    // ignore quota errors
  }
}

// Function to add to history from outside hook context
export function addToHistory(entry: { mode: string; inputSnippet: string; output: UnifiedOutput }) {
  if (typeof window === "undefined") return
  const current = readStorage()
  const newEntry: HistoryEntry = {
    id: crypto.randomUUID(),
    mode: entry.mode,
    inputSnippet: entry.inputSnippet,
    output: entry.output,
    timestamp: Date.now(),
  }
  const next = [newEntry, ...current].slice(0, MAX_ITEMS)
  writeStorage(next)
  // Trigger storage event for other tabs
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }))
}

export function useHistory() {
  const [items, setItems] = useState<HistoryEntry[]>([])

  useEffect(() => {
    setItems(readStorage())
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) setItems(readStorage())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const add = useCallback((item: Omit<HistoryEntry, "id" | "timestamp">) => {
    const fullItem: HistoryEntry = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    setItems((prev) => {
      const next = [fullItem, ...prev].slice(0, MAX_ITEMS)
      writeStorage(next)
      return next
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((p) => p.id !== id)
      writeStorage(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setItems([])
    writeStorage([])
  }, [])

  return { items, add, remove, clear }
}
