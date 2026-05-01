"use client"

import { useState } from "react"
import { History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/i18n/locale-context"
import { UnifiedForm } from "./unified-form"
import { HistoryPanel } from "./history-panel"
import { useHistory } from "./history-store"

export function EnCriolloApp() {
  const { t } = useLocale()
  const { items, remove, clear } = useHistory()
  const [historyKey, setHistoryKey] = useState(0)

  return (
    <div className="rounded-xl border-2 border-border bg-card shadow-sm relative" style={{ borderColor: "color-mix(in oklch, var(--neon) 15%, var(--border))" }}>
      <div className="p-4 sm:p-6">
        <UnifiedForm key={historyKey} onHistoryChange={() => setHistoryKey((k) => k + 1)} />
      </div>
      <div className="absolute bottom-4 right-4">
        <HistoryPanel
          items={items}
          onSelect={() => {}}
          onRemove={remove}
          onClear={clear}
        />
      </div>
    </div>
  )
}
