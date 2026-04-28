"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, RotateCcw } from "lucide-react"
import { useLocale } from "@/lib/i18n/locale-context"
import { CharCounter, MAX_INPUT_CHARS } from "./char-counter"
import { logEncriolloError } from "./error-logger"
import type { UnderstandOutput } from "./types"

const SENDERS = [
  "snd.unspecified",
  "snd.bank",
  "snd.lawyer",
  "snd.hr",
  "snd.gov",
  "snd.platform",
  "snd.medical",
  "snd.school",
  "snd.personal",
  "snd.other",
] as const

const CONTEXT_KEYS = [
  { value: "general", es: "General", en: "General" },
  { value: "laboral", es: "Laboral", en: "Work" },
  { value: "legal", es: "Legal / contrato", en: "Legal / contract" },
  { value: "medico", es: "Médico", en: "Medical" },
  { value: "financiero", es: "Financiero / banco", en: "Financial / bank" },
  { value: "academico", es: "Académico / técnico", en: "Academic / technical" },
  { value: "personal", es: "Personal", en: "Personal" },
] as const

const SIMPLICITY = [
  { value: "muy-simple", es: "Como si tuviera 12 años", en: "Like I'm 12" },
  { value: "simple", es: "Simple y directo", en: "Simple and direct" },
  { value: "estandar", es: "Estándar", en: "Standard" },
] as const

type Props = {
  onResult: (r: UnderstandOutput, inputPreview: string) => void
  onReset: () => void
  hasResult: boolean
}

export function UnderstandForm({ onResult, onReset, hasResult }: Props) {
  const { t, locale } = useLocale()
  const [text, setText] = useState("")
  const [senderType, setSenderType] = useState<(typeof SENDERS)[number]>("snd.unspecified")
  const [senderOther, setSenderOther] = useState("")
  const [objective, setObjective] = useState("")
  const [context, setContext] = useState("general")
  const [simplicityLevel, setSimplicityLevel] = useState("simple")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) {
      toast.error(t("u.error.empty"))
      return
    }
    if (text.length > MAX_INPUT_CHARS) {
      toast.error(t("common.charLimit", { n: MAX_INPUT_CHARS }))
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/encriollo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "entender",
          text,
          locale,
          senderType,
          senderOther: senderType === "snd.other" ? senderOther : undefined,
          objective,
          context,
          simplicityLevel,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg = data.error || t("common.error.generic")
        logEncriolloError({
          mode: "entender",
          inputLength: text.length,
          errorLabel: msg,
          locale,
          status: res.status,
        })
        throw new Error(msg)
      }
      const data = await res.json()
      onResult(data.result, text.slice(0, 240))
    } catch (err) {
      const label = err instanceof Error ? err.message : "unknown_error"
      if (!(err instanceof Error && err.message)) {
        logEncriolloError({ mode: "entender", inputLength: text.length, errorLabel: label, locale })
      }
      toast.error(err instanceof Error ? err.message : t("common.error.generic"))
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setText("")
    setObjective("")
    onReset()
  }

  return (
    <>
    <form id="understand-form" onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="text" className="text-sm font-medium">
          {t("u.text.label")}
        </Label>
        <Textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("u.text.placeholder")}
          className="min-h-40 resize-y bg-background"
          disabled={loading}
          aria-invalid={text.length > MAX_INPUT_CHARS}
        />
        <CharCounter value={text} hint={text.length === 0 ? t("u.text.hint") : undefined} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sender" className="text-sm font-medium">
            {t("u.sender.label")}
          </Label>
          <Select value={senderType} onValueChange={(v) => setSenderType(v as typeof senderType)} disabled={loading}>
            <SelectTrigger id="sender" className="bg-background">
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
          {senderType === "snd.other" && (
            <Input
              value={senderOther}
              onChange={(e) => setSenderOther(e.target.value)}
              placeholder={t("u.sender.other.placeholder")}
              className="bg-background mt-1"
              disabled={loading}
              maxLength={120}
              aria-label={t("u.sender.other.label")}
            />
          )}
          <p className="text-xs text-muted-foreground">{t("u.sender.help")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="context" className="text-sm font-medium">
            {t("u.context.label")}
          </Label>
          <Select value={context} onValueChange={setContext} disabled={loading}>
            <SelectTrigger id="context" className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTEXT_KEYS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {locale === "en" ? c.en : c.es}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="objective" className="text-sm font-medium">
          {t("u.objective.label")} <span className="text-muted-foreground font-normal">{t("common.optional")}</span>
        </Label>
        <Input
          id="objective"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder={t("u.objective.placeholder")}
          className="bg-background"
          disabled={loading}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">{t("u.objective.help")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="simplicity" className="text-sm font-medium">
          {t("u.simplicity.label")}
        </Label>
        <Select value={simplicityLevel} onValueChange={setSimplicityLevel} disabled={loading}>
          <SelectTrigger id="simplicity" className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SIMPLICITY.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {locale === "en" ? s.en : s.es}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

    </form>

    <div className="flex flex-col items-center gap-2 pt-4">
      <Button
        type="submit"
        form="understand-form"
        disabled={loading || text.length > MAX_INPUT_CHARS}
        size="lg"
        className="w-full max-w-xs"
      >
        {loading ? (
          <><Loader2 className="size-4 animate-spin mr-2" aria-hidden />{t("u.submit.loading")}</>
        ) : (
          t("u.submit")
        )}
      </Button>
      {(text || hasResult) && !loading && (
        <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="gap-1.5 text-muted-foreground">
          <RotateCcw className="size-3.5" aria-hidden />
          {t("u.clear")}
        </Button>
      )}
    </div>
    </>
  )
}
