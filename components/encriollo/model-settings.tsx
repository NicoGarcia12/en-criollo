"use client"

import { useState } from "react"
import { Settings2, Check, RotateCcw, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useModel, MODEL_PRESETS, DEFAULT_MODEL } from "./model-context"

export function ModelSettings() {
  const { model, setModel, isCustom, reset } = useModel()
  const [open, setOpen] = useState(false)
  const [customValue, setCustomValue] = useState(isCustom ? model : "")

  function applyCustom() {
    if (!customValue.trim()) return
    if (!/^[\w-]+\/[\w.\-:]+$/.test(customValue.trim())) return
    setModel(customValue.trim())
  }

  const currentPreset = MODEL_PRESETS.find((p) => p.id === model)
  const shortLabel = currentPreset?.label ?? model

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent" aria-label="Configurar modelo">
          <Settings2 className="size-4" aria-hidden />
          <span className="hidden sm:inline text-xs font-mono">{shortLabel}</span>
          <span className="sm:hidden">Modelo</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,22rem)] p-0">
        <div className="p-4 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Modelo de IA</h3>
            {model !== DEFAULT_MODEL && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  reset()
                  setCustomValue("")
                }}
              >
                <RotateCcw className="size-3" aria-hidden />
                Default
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Elegí qué modelo procesa tus textos. Por defecto se usa el AI Gateway de Vercel.
          </p>
        </div>

        <Separator />

        <div className="max-h-72 overflow-y-auto p-2">
          <ul className="space-y-1">
            {MODEL_PRESETS.map((preset) => {
              const active = model === preset.id
              return (
                <li key={preset.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setModel(preset.id)
                      setCustomValue("")
                    }}
                    className={`w-full text-left rounded-md p-2.5 text-sm transition-colors hover:bg-secondary focus:bg-secondary focus:outline-none ${
                      active ? "bg-secondary" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{preset.label}</span>
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {preset.provider}
                          </Badge>
                          {preset.requiresKey && (
                            <Badge variant="outline" className="text-[10px] font-normal">
                              API key
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{preset.description}</p>
                        <code className="text-[10px] text-muted-foreground/80 font-mono mt-1 inline-block">
                          {preset.id}
                        </code>
                      </div>
                      {active && <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <Separator />

        <div className="p-4 space-y-2">
          <Label htmlFor="custom-model" className="text-xs font-medium flex items-center gap-1.5">
            Modelo personalizado
            <Info className="size-3 text-muted-foreground" aria-hidden />
          </Label>
          <div className="flex gap-2">
            <Input
              id="custom-model"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="proveedor/modelo"
              className="font-mono text-xs h-9"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={applyCustom}
              disabled={
                !customValue.trim() ||
                customValue.trim() === model ||
                !/^[\w-]+\/[\w.\-:]+$/.test(customValue.trim())
              }
            >
              Aplicar
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Formato: <code className="font-mono">proveedor/modelo</code>. Cualquier modelo soportado por Vercel AI
            Gateway.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
