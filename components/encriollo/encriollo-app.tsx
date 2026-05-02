"use client"

import { useState } from "react"
import { UnifiedForm } from "./unified-form"
import { HistoryPanel } from "./history-panel"
import { useHistory } from "./history-store"
import type { HistoryEntry } from "./types"

export function EnCriolloApp() {
  const { items, remove, clear } = useHistory()

  // historyKey fuerza re-mount de UnifiedForm cuando cambia
  // Sirve tanto para refrescar el contador del panel como para cargar una entrada seleccionada
  const [historyKey, setHistoryKey] = useState(0)

  // Entrada seleccionada del historial para pre-cargar en el formulario
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)

  // Al seleccionar una entrada: guardamos los valores Y forzamos re-mount del formulario
  function handleSelect(item: HistoryEntry) {
    setSelectedEntry(item)
    // Incrementar la key provoca que UnifiedForm se desmonte y remonte,
    // ejecutando useState con los nuevos initialValues desde cero
    setHistoryKey((k) => k + 1)
  }

  return (
    <div
      className="border-border bg-card rounded-xl border-2 shadow-sm"
      style={{ borderColor: "color-mix(in oklch, var(--neon) 15%, var(--border))" }}
    >
      <div className="p-4 sm:p-6">
        {/* key={historyKey} + initialValues={selectedEntry} hacen la magia:
            cuando key cambia, React re-monta el componente y useState
            toma los initialValues nuevos como punto de partida */}
        <UnifiedForm key={historyKey} initialValues={selectedEntry ?? undefined} />
      </div>
      {/* Footer del card: historial alineado a la derecha, separado del form */}
      <div className="border-border/50 flex justify-end border-t px-4 py-3 sm:px-6">
        <HistoryPanel items={items} onSelect={handleSelect} onRemove={remove} onClear={clear} />
      </div>
    </div>
  )
}
