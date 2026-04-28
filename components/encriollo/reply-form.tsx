"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Loader2, RotateCcw } from "lucide-react"
import { useModel } from "./model-context"
import type { ReplyOutput } from "./types"

const RELATIONSHIPS = [
  { value: "trabajo", label: "Trabajo / colega" },
  { value: "jefe", label: "Jefe / superior" },
  { value: "cliente", label: "Cliente" },
  { value: "amigo", label: "Amigo" },
  { value: "familia", label: "Familia" },
  { value: "pareja", label: "Pareja" },
  { value: "desconocido", label: "Desconocido" },
  { value: "otro", label: "Otro" },
]

const TONES = [
  { value: "amable", label: "Amable" },
  { value: "profesional", label: "Profesional" },
  { value: "neutral", label: "Neutral" },
  { value: "firme", label: "Firme" },
  { value: "cercano", label: "Cercano / informal" },
  { value: "empatico", label: "Empático" },
]

type Props = {
  onResult: (r: ReplyOutput) => void
  onReset: () => void
  hasResult: boolean
}

export function ReplyForm({ onResult, onReset, hasResult }: Props) {
  const [text, setText] = useState("")
  const [relationship, setRelationship] = useState("trabajo")
  const [userGoal, setUserGoal] = useState("")
  const [tone, setTone] = useState("amable")
  const [loading, setLoading] = useState(false)
  const { model } = useModel()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) {
      toast.error("Pegá el mensaje que recibiste")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/encriollo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "responder",
          text,
          relationship,
          userGoal: userGoal.trim() || "responder bien",
          tone,
          model,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Error al procesar")
      }
      const data = await res.json()
      onResult(data.result)
    } catch (err) {
      console.log("[v0] reply error:", err)
      toast.error(err instanceof Error ? err.message : "Algo salió mal")
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setText("")
    setUserGoal("")
    onReset()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm font-medium">
          Mensaje recibido
        </Label>
        <Textarea
          id="message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Pegá acá el mensaje, WhatsApp, mail o cualquier texto al que querés contestar bien…"
          className="min-h-32 resize-y bg-background"
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="relationship" className="text-sm font-medium">
            Relación con la persona
          </Label>
          <Select value={relationship} onValueChange={setRelationship} disabled={loading}>
            <SelectTrigger id="relationship" className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tone" className="text-sm font-medium">
            Tono deseado
          </Label>
          <Select value={tone} onValueChange={setTone} disabled={loading}>
            <SelectTrigger id="tone" className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TONES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal" className="text-sm font-medium">
          ¿Qué querés conseguir? <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input
          id="goal"
          value={userGoal}
          onChange={(e) => setUserGoal(e.target.value)}
          placeholder="Ej: pedir más tiempo, decir que no, aclarar un malentendido…"
          className="bg-background"
          disabled={loading}
        />
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
              Ayudame a responder
            </>
          )}
        </Button>
        {(text || userGoal || hasResult) && !loading && (
          <Button type="button" variant="ghost" onClick={handleClear} className="gap-2">
            <RotateCcw className="size-4" aria-hidden />
            Limpiar
          </Button>
        )}
      </div>
    </form>
  )
}
