"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Loader2, RotateCcw } from "lucide-react"
import { useModel } from "./model-context"
import type { UnderstandOutput } from "./types"

const CONTEXTS = [
  { value: "general", label: "General" },
  { value: "laboral", label: "Laboral" },
  { value: "legal", label: "Legal / contrato" },
  { value: "medico", label: "Médico" },
  { value: "financiero", label: "Financiero / banco" },
  { value: "academico", label: "Académico / técnico" },
  { value: "personal", label: "Personal" },
]

const SIMPLICITY = [
  { value: "muy-simple", label: "Como si tuviera 12 años" },
  { value: "simple", label: "Simple y directo" },
  { value: "estandar", label: "Estándar" },
]

type Props = {
  onResult: (r: UnderstandOutput) => void
  onReset: () => void
  hasResult: boolean
}

export function UnderstandForm({ onResult, onReset, hasResult }: Props) {
  const [text, setText] = useState("")
  const [context, setContext] = useState("general")
  const [simplicityLevel, setSimplicityLevel] = useState("simple")
  const [loading, setLoading] = useState(false)
  const { model } = useModel()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) {
      toast.error("Pegá un texto para empezar")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/encriollo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "entender", text, context, simplicityLevel, model }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Error al procesar")
      }
      const data = await res.json()
      onResult(data.result)
    } catch (err) {
      console.log("[v0] understand error:", err)
      toast.error(err instanceof Error ? err.message : "Algo salió mal")
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setText("")
    onReset()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="text" className="text-sm font-medium">
          Pegá el texto difícil
        </Label>
        <Textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Pegá acá el contrato, mail, carta del banco, mensaje legal o cualquier texto que no termines de entender…"
          className="min-h-40 resize-y bg-background"
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          {text.length > 0 ? `${text.length.toLocaleString("es")} caracteres` : "Cuanto más completo, mejor el análisis."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="context" className="text-sm font-medium">
            Contexto
          </Label>
          <Select value={context} onValueChange={setContext} disabled={loading}>
            <SelectTrigger id="context" className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTEXTS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="simplicity" className="text-sm font-medium">
            Nivel de simpleza
          </Label>
          <Select value={simplicityLevel} onValueChange={setSimplicityLevel} disabled={loading}>
            <SelectTrigger id="simplicity" className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIMPLICITY.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <Button type="submit" disabled={loading} size="lg" className="gap-2">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Pensando…
            </>
          ) : (
            <>
              <Sparkles className="size-4" aria-hidden />
              Explicámelo en criollo
            </>
          )}
        </Button>
        {(text || hasResult) && !loading && (
          <Button type="button" variant="ghost" onClick={handleClear} className="gap-2">
            <RotateCcw className="size-4" aria-hidden />
            Limpiar
          </Button>
        )}
      </div>
    </form>
  )
}
