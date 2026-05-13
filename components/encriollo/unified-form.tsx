"use client"

import { useCallback, useEffect, useState } from "react"
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
import { CharCounter, MAX_INPUT_CHARS } from "./char-counter"
import { UnifiedResult } from "./unified-result"
import { logEncriolloError } from "./error-logger"
import { addToHistory } from "./history-store"
import type { HistoryEntry, UnifiedOutput } from "./types"

const RATE_LIMIT_MAX_REQUESTS = 15
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_STORAGE_KEY = "encriollo:frontend-rate-limit:v1"

interface RateLimitSnapshot {
  attempts: number[]
  blocked: boolean
  remainingMs: number
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function readRateLimitAttempts(): number[] {
  if (!canUseLocalStorage()) return []

  // localStorage viene de un borde externo: validamos forma y tipos.
  const rawValue = localStorage.getItem(RATE_LIMIT_STORAGE_KEY)
  if (!rawValue) return []

  try {
    const parsed: unknown = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((value): value is number => Number.isFinite(value) && value > 0)
  } catch {
    return []
  }
}

function writeRateLimitAttempts(attempts: number[]): void {
  if (!canUseLocalStorage()) return

  localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(attempts))
}

function getRateLimitSnapshot(nowMs: number): RateLimitSnapshot {
  const attempts = readRateLimitAttempts().filter(
    (timestamp) => nowMs - timestamp < RATE_LIMIT_WINDOW_MS,
  )

  writeRateLimitAttempts(attempts)

  if (attempts.length < RATE_LIMIT_MAX_REQUESTS) {
    return { attempts, blocked: false, remainingMs: 0 }
  }

  // Ventana rolling: desbloquea cuando el intento más viejo sale de la ventana de 1h.
  const oldestAttempt = attempts[0]
  const remainingMs = Math.max(0, oldestAttempt + RATE_LIMIT_WINDOW_MS - nowMs)

  return { attempts, blocked: remainingMs > 0, remainingMs }
}

function formatRemainingTime(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

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
  // Valores iniciales para pre-cargar el formulario (p.ej. desde el historial)
  // Partial<HistoryEntry> porque no necesitamos id/timestamp para restaurar
  initialValues?: Partial<HistoryEntry>
}

export function UnifiedForm({ initialValues }: UnifiedFormProps) {
  const { t } = useLocale()

  // Estado principal — inicializado con initialValues si se pasan
  // Esto funciona porque el componente se re-monta (via key) cuando initialValues cambia
  const [text, setText] = useState(initialValues?.text ?? "")
  const [mode, setMode] = useState<"understand" | "reply" | "">(
    (initialValues?.mode as "understand" | "reply" | "") ?? "",
  )

  // Campos compartidos
  const [sender, setSender] = useState<(typeof SENDERS)[number]>(
    (initialValues?.sender as (typeof SENDERS)[number]) ?? "sender.unknown",
  )
  const [senderOther, setSenderOther] = useState("")

  // Campos modo "entender"
  const [simplicity, setSimplicity] = useState<(typeof SIMPLICITY)[number] | "">(
    (initialValues?.simplicity as (typeof SIMPLICITY)[number]) ?? "",
  )
  const [objective, setObjective] = useState(initialValues?.objective ?? "")

  // Campos modo "responder"
  const [tone, setTone] = useState<(typeof TONES)[number]>(
    (initialValues?.tone as (typeof TONES)[number]) ?? "friendly",
  )
  const [format, setFormat] = useState<(typeof FORMATS)[number]>(
    (initialValues?.format as (typeof FORMATS)[number]) ?? "whatsapp",
  )
  const [goal, setGoal] = useState(initialValues?.goal ?? "")
  const [signature, setSignature] = useState(initialValues?.signature ?? "")
  const [showContext, setShowContext] = useState(
    // Si hay contexto previo guardado, mostrarlo expandido automáticamente
    Boolean(initialValues?.priorContext),
  )
  const [priorContext, setPriorContext] = useState(initialValues?.priorContext ?? "")

  // Estado de UI
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UnifiedOutput | null>(null)
  const [remainingBlockMs, setRemainingBlockMs] = useState<number>(() => {
    const snapshot = getRateLimitSnapshot(Date.now())
    return snapshot.blocked ? snapshot.remainingMs : 0
  })

  const showFrontendRateLimit = useCallback(
    (remainingMs: number): void => {
      const maybeTranslated = t("common.error.rateLimit")
      const baseMessage =
        maybeTranslated !== "common.error.rateLimit"
          ? maybeTranslated
          : "Límite de solicitudes alcanzado. Esperá antes de volver a enviar."

      setResult({
        error: `${baseMessage} (${formatRemainingTime(remainingMs)})`,
        errorCode: "rate_limit",
      } as UnifiedOutput)
    },
    [t],
  )

  useEffect(() => {
    if (remainingBlockMs <= 0) return

    // Countdown reactivo con cleanup para evitar pérdidas de memoria.
    const intervalId = window.setInterval(() => {
      const snapshot = getRateLimitSnapshot(Date.now())

      if (!snapshot.blocked) {
        setRemainingBlockMs(0)
        return
      }

      setRemainingBlockMs(snapshot.remainingMs)
      showFrontendRateLimit(snapshot.remainingMs)
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [remainingBlockMs, showFrontendRateLimit])

  const isFrontendBlocked = remainingBlockMs > 0

  const canSubmit =
    text.trim().length > 0 &&
    mode !== "" &&
    (mode === "reply" || simplicity !== "") &&
    text.length <= MAX_INPUT_CHARS

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    const preSubmitSnapshot = getRateLimitSnapshot(Date.now())
    if (preSubmitSnapshot.blocked) {
      setRemainingBlockMs(preSubmitSnapshot.remainingMs)
      showFrontendRateLimit(preSubmitSnapshot.remainingMs)
      return
    }

    // Registramos el intento ANTES del request para que el límite sea por envíos
    // y no dependa de la respuesta del backend.
    writeRateLimitAttempts([...preSubmitSnapshot.attempts, Date.now()])

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

      let data: unknown
      try {
        data = await res.json()
      } catch {
        throw new Error(t("common.error.invalidResponse"))
      }

      if (!res.ok) {
        if (res.status === 429) {
          // Caso especial de alta demanda/límite de pedidos.
          // Guardamos un código para que la UI reutilice la estética de error,
          // pero con comportamiento/copy específico (sin título + botón Cerrar).
          setResult({
            error: t("common.error.rateLimit"),
            errorCode: "rate_limit",
          } as UnifiedOutput)
          return
        }

        const apiError =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error?: string }).error || "")
            : ""

        throw new Error(apiError || t("common.error.server"))
      }

      setResult(data as UnifiedOutput)
      // Guardamos todos los campos del formulario para poder restaurarlos desde el historial
      addToHistory({
        mode,
        inputSnippet: text.slice(0, 80),
        output: data as UnifiedOutput,
        text,
        sender,
        simplicity: simplicity || undefined,
        objective: objective.trim() || undefined,
        tone: mode === "reply" ? tone : undefined,
        format: mode === "reply" ? format : undefined,
        goal: mode === "reply" && goal.trim() ? goal.trim() : undefined,
        signature: mode === "reply" && signature.trim() ? signature.trim() : undefined,
        priorContext: mode === "reply" && priorContext.trim() ? priorContext.trim() : undefined,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error.server")
      const userMsg = msg.toLowerCase().includes("fetch") ? t("common.error.network") : msg

      logEncriolloError({
        mode: (mode as "entender" | "responder") || "entender",
        inputLength: text.length,
        errorLabel: userMsg,
        locale: "es",
      })
      setResult({ error: userMsg } as UnifiedOutput)
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setText("")
    setMode("")
    setSender("sender.unknown")
    setSenderOther("")
    setSimplicity("")
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
            className="bg-input border-border min-h-[140px] resize-y"
            disabled={loading}
            aria-describedby="char-counter"
          />
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <CharCounter id="char-counter" value={text} />
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
          <div className="border-border space-y-4 border-t pt-2">
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
                    {t("uf.objective.label")}{" "}
                    <span className="text-muted-foreground text-xs">({t("optional")})</span>
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
                    {t("uf.goal.label")}{" "}
                    <span className="text-muted-foreground text-xs">({t("optional")})</span>
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
                    {t("uf.signature.label")}{" "}
                    <span className="text-muted-foreground text-xs">({t("optional")})</span>
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
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
                  >
                    <ChevronDown
                      className={`size-4 transition-transform ${showContext ? "rotate-180" : ""}`}
                    />
                    {t("uf.context.toggle")}
                  </button>
                  {showContext && (
                    <Textarea
                      value={priorContext}
                      onChange={(e) => setPriorContext(e.target.value)}
                      placeholder={t("uf.context.placeholder")}
                      className="bg-input border-border min-h-[80px]"
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
          disabled={!canSubmit || loading || isFrontendBlocked}
          size="lg"
          className="w-full max-w-xs"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
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
            className="text-muted-foreground gap-1.5"
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
