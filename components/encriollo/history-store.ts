"use client"

import { useCallback, useEffect, useState } from "react"
import type { HistoryItem } from "./types"

const STORAGE_KEY = "encriollo:history"
const MAX_ITEMS = 5

function readStorage(): HistoryItem[] {
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

function writeStorage(items: HistoryItem[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
  } catch {
    // ignore quota errors
  }
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([])

  useEffect(() => {
    setItems(readStorage())
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStorage())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const add = useCallback((item: Omit<HistoryItem, "id" | "createdAt"> & { id?: string }) => {
    const fullItem = {
      ...item,
      id: item.id ?? crypto.randomUUID(),
      createdAt: Date.now(),
    } as HistoryItem
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
