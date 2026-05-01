"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, RotateCcw, ChevronDown } from "lucide-react"
import { useLocale } from "@/lib/i18n/locale-context"
import { CharCounter } from "./char-counter"
import { UnifiedResult } from "./unified-result"
import { logEncriolloError } from "./error-logger"
import { addToHistory } from "./history-store"
import type { UnifiedOutput } from "./types"

const MAX_INPUT_CHARS = 8000 // limit

// Opciones de remitente (para ambos modos)
const SENDERS = [
  "sender.unknown",
  "sender.bank",
  "sender.lawyer",
  "sender.hr",
  "sender.gov",
  "sender.platform",
  "sender.medical",
  "sender.work",
  "sender.client",
  "sender.boss",
  "sender.family",
  "sender.partner",
  "sender.friend",
  "sender.other",
] as const

const SIMPLICITY = ["simple", "detailed", "very_detailed"] as const
const TONES = ["formal", "friendly", "firm", "warm", "professional", "cold"] as const
const FORMATS = ["whatsapp", "email", "sms", "linkedin", "letter"] as const

interface UnifiedFormProps {
  onHistoryChange?: () => void
}

export function UnifiedForm({ onHistoryChange }: UnifiedFormProps) {
  const { t } = useLocale()

  // Estado principal
  const [text, setText] = useState("")
  const [mode, setMode] = useState<"understand" | "reply" | "">("")

  // Campos compartidos
  const [sender, setSender] = useState<(typeof SENDERS)[number]>("sender.unknown")
  const [senderOther, setSenderOther] = useState("")

  // Campos modo "entender"
  const [simplicity, setSimplicity] = useState<(typeof SIMPLICITY)[number] | "">("")
  const [objective, setObjective] = useState("")

  // Campos modo "responder"
  const [tone, setTone] = useState<(typeof TONES)[number]>("friendly")
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("whatsapp")
  const [goal, setGoal] = useState("")
  const [signature, setSignature] = useState("")
  const [showContext, setShowContext] = useState(false)
  const [priorContext, setPriorContext] = useState("")

  // Estado de UI
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UnifiedOutput | null>(null)

  const canSubmit = text.trim().length > 0 && mode !== "" && (mode === "reply" || simplicity !== "") && text.length <= MAX_INPUT_CHARS

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setResult(null)

    try {
      const payload = {
        mode,
        text,
        sender,
        senderOther: sender === "sender.other" ? senderOther : undefined,
        // Modo entender
        ...(mode === "understand" && {
          simplicity,
          objective: objective.trim() || undefined,
        }),
        // Modo responder
        ...(mode === "reply" && {
          tone,
          format,
          goal: goal.trim() || undefined,
          signature: signature.trim() || undefined,
          priorContext: priorContext.trim() || undefined,
        }),
      }

      const res = await fetch("/api/encriollo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error processing request")
      }

      setResult(data)
      addToHistory({
        mode,
        inputSnippet: text.slice(0, 80),
        output: data,
      })
      onHistoryChange?.()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      logEncriolloError({
        mode: (mode as "entender" | "responder") || "entender",
        inputLength: text.length,
        errorLabel: msg,
        locale: "es",
      })
      setResult({ error: msg } as UnifiedOutput)
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setText("")
    setMode("")
    setSender("sender.unknown")
    setSenderOther("")
    setSimplicity("simple")
    setObjective("")
    setTone("friendly")
    setFormat("whatsapp")
    setGoal("")
    setSignature("")
    setPriorContext("")
    setShowContext(false)
    setResult(null)
  }

  const hasContent = text.trim().length > 0 || result !== null

  return (
    <>
      <form id="unified-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Texto principal */}
        <div className="space-y-2">
          <Label htmlFor="text" className="text-sm font-medium">
            {t("uf.text.label")}
          </Label>
          <Textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("uf.text.placeholder")}
            className="min-h-[140px] bg-input border-border resize-y"
            disabled={loading}
            aria-describedby="char-counter"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <CharCounter current={text.length} max={MAX_INPUT_CHARS} />
            <span>{t("uf.text.hint")}</span>
          </div>
        </div>

        {/* Selector de modo - OBLIGATORIO */}
        <div className="space-y-2">
          <Label htmlFor="mode" className="text-sm font-medium">
            {t("uf.mode.label")} <span className="text-destructive">*</span>
          </Label>
          <Select
            value={mode}
            onValueChange={(v) => setMode(v as "understand" | "reply")}
            disabled={loading}
          >
            <SelectTrigger id="mode" className="bg-input border-border">
              <SelectValue placeholder={t("uf.mode.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="understand">{t("uf.mode.understand")}</SelectItem>
              <SelectItem value="reply">{t("uf.mode.reply")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campos condicionales según modo */}
        {mode && (
          <div className="space-y-4 pt-2 border-t border-border">
            {/* Remitente - compartido */}
            <div className="space-y-2">
              <Label htmlFor="sender" className="text-sm font-medium">
                {t("uf.sender.label")}
              </Label>
              <Select
                value={sender}
                onValueChange={(v) => setSender(v as (typeof SENDERS)[number])}
                disabled={loading}
              >
                <SelectTrigger id="sender" className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SENDERS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sender === "sender.other" && (
                <Input
                  value={senderOther}
                  onChange={(e) => setSenderOther(e.target.value)}
                  placeholder={t("uf.sender.other.placeholder")}
                  className="bg-input border-border mt-1"
                  disabled={loading}
                  maxLength={100}
                />
              )}
            </div>

            {/* MODO ENTENDER */}
            {mode === "understand" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="simplicity" className="text-sm font-medium">
                    {t("uf.simplicity.label")}
                  </Label>
                  <Select
                    value={simplicity}
                    onValueChange={(v) => setSimplicity(v as (typeof SIMPLICITY)[number])}
                    disabled={loading}
                  >
                    <SelectTrigger id="simplicity" className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIMPLICITY.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`simplicity.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objective" className="text-sm font-medium">
                    {t("uf.objective.label")} <span className="text-muted-foreground text-xs">({t("optional")})</span>
                  </Label>
                  <Input
                    id="objective"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder={t("uf.objective.placeholder")}
                    className="bg-input border-border"
                    disabled={loading}
                    maxLength={200}
                  />
                </div>
              </>
            )}

            {/* MODO RESPONDER */}
            {mode === "reply" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="tone" className="text-sm font-medium">
                      {t("uf.tone.label")}
                    </Label>
                    <Select
                      value={tone}
                      onValueChange={(v) => setTone(v as (typeof TONES)[number])}
                      disabled={loading}
                    >
                      <SelectTrigger id="tone" className="bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONES.map((tn) => (
                          <SelectItem key={tn} value={tn}>
                            {t(`tone.${tn}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format" className="text-sm font-medium">
                      {t("uf.format.label")}
                    </Label>
                    <Select
                      value={format}
                      onValueChange={(v) => setFormat(v as (typeof FORMATS)[number])}
                      disabled={loading}
                    >
                      <SelectTrigger id="format" className="bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMATS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {t(`format.${f}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal" className="text-sm font-medium">
                    {t("uf.goal.label")} <span className="text-muted-foreground text-xs">({t("optional")})</span>
                  </Label>
                  <Input
                    id="goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder={t("uf.goal.placeholder")}
                    className="bg-input border-border"
                    disabled={loading}
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signature" className="text-sm font-medium">
                    {t("uf.signature.label")} <span className="text-muted-foreground text-xs">({t("optional")})</span>
                  </Label>
                  <Input
                    id="signature"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder={t("uf.signature.placeholder")}
                    className="bg-input border-border"
                    disabled={loading}
                    maxLength={50}
                  />
                </div>

                {/* Contexto previo colapsable */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowContext(!showContext)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronDown className={`size-4 transition-transform ${showContext ? "rotate-180" : ""}`} />
                    {t("uf.context.toggle")}
                  </button>
                  {showContext && (
                    <Textarea
                      value={priorContext}
                      onChange={(e) => setPriorContext(e.target.value)}
                      placeholder={t("uf.context.placeholder")}
                      className="min-h-[80px] bg-input border-border"
                      disabled={loading}
                      maxLength={500}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </form>

      {/* Botón submit - fuera del form, centrado */}
      <div className="flex flex-col items-center gap-2 pt-5">
        <Button
          type="submit"
          form="unified-form"
          disabled={!canSubmit || loading}
          size="lg"
          className="w-full max-w-xs"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" aria-hidden />
              {t("uf.submit.loading")}
            </>
          ) : (
            t(mode === "reply" ? "uf.submit.reply" : "uf.submit.understand")
          )}
        </Button>
        {hasContent && !loading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            {t("uf.clear")}
          </Button>
        )}
      </div>

      {/* Resultado */}
      {result && <UnifiedResult data={result} mode={mode as "understand" | "reply"} />}
    </>
  )
}
