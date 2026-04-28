"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquareReply, Loader2, RotateCcw } from "lucide-react"
import { useLocale } from "@/lib/i18n/locale-context"
import { CharCounter, MAX_INPUT_CHARS } from "./char-counter"
import { logEncriolloError } from "./error-logger"
import type { ReplyOutput } from "./types"

const RELATIONSHIPS = [
  { value: "trabajo", es: "Trabajo / colega", en: "Work / colleague" },
  { value: "jefe", es: "Jefe / superior", en: "Boss / manager" },
  { value: "cliente", es: "Cliente", en: "Client" },
  { value: "amigo", es: "Amigo", en: "Friend" },
  { value: "familia", es: "Familia", en: "Family" },
  { value: "pareja", es: "Pareja", en: "Partner" },
  { value: "desconocido", es: "Desconocido", en: "Stranger" },
  { value: "otro", es: "Otro", en: "Other" },
] as const

const TONES = [
  { value: "amable", es: "Amable", en: "Kind" },
  { value: "profesional", es: "Profesional", en: "Professional" },
  { value: "neutral", es: "Neutral", en: "Neutral" },
  { value: "firme", es: "Firme", en: "Firm" },
  { value: "cercano", es: "Cercano / informal", en: "Warm / informal" },
  { value: "empatico", es: "Empático", en: "Empathic" },
] as const

const LENGTHS = [
  { value: "short", key: "len.short" as const },
  { value: "medium", key: "len.medium" as const },
  { value: "detailed", key: "len.detailed" as const },
]

const FORMATS = [
  { value: "whatsapp", key: "fmt.whatsapp" as const },
  { value: "email", key: "fmt.email" as const },
  { value: "sms", key: "fmt.sms" as const },
  { value: "linkedin", key: "fmt.linkedin" as const },
  { value: "letter", key: "fmt.letter" as const },
]

type Props = {
  onResult: (r: ReplyOutput, inputPreview: string) => void
  onReset: () => void
  hasResult: boolean
}

export function ReplyForm({ onResult, onReset, hasResult }: Props) {
  const { t, locale } = useLocale()
  const [text, setText] = useState("")
  const [relationship, setRelationship] = useState("trabajo")
  const [relationshipOther, setRelationshipOther] = useState("")
  const [userGoal, setUserGoal] = useState("")
  const [tone, setTone] = useState("amable")
  const [length, setLength] = useState("medium")
  const [format, setFormat] = useState("whatsapp")
  const [signature, setSignature] = useState("")
  const [previousContext, setPreviousContext] = useState("")
  const [sayPoints, setSayPoints] = useState("")
  const [avoidPoints, setAvoidPoints] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) {
      toast.error(t("r.error.empty"))
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
          mode: "responder",
          text,
          locale,
          relationship,
          relationshipOther: relationship === "otro" ? relationshipOther : undefined,
          userGoal: userGoal.trim() || (locale === "en" ? "respond well" : "responder bien"),
          tone,
          length,
          format,
          signature,
          previousContext,
          sayPoints,
          avoidPoints,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg = data.error || t("common.error.generic")
        logEncriolloError({
          mode: "responder",
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
        logEncriolloError({ mode: "responder", inputLength: text.length, errorLabel: label, locale })
      }
      toast.error(err instanceof Error ? err.message : t("common.error.generic"))
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setText("")
    setUserGoal("")
    setSignature("")
    setPreviousContext("")
    setSayPoints("")
    setAvoidPoints("")
    onReset()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm font-medium">
          {t("r.text.label")}
        </Label>
        <Textarea
          id="message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("r.text.placeholder")}
          className="min-h-32 resize-y bg-background"
          disabled={loading}
          aria-invalid={text.length > MAX_INPUT_CHARS}
        />
        <CharCounter value={text} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="relationship" className="text-sm font-medium">
            {t("r.relationship.label")}
          </Label>
          <Select value={relationship} onValueChange={setRelationship} disabled={loading}>
            <SelectTrigger id="relationship" className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {locale === "en" ? r.en : r.es}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {relationship === "otro" && (
            <Input
              value={relationshipOther}
              onChange={(e) => setRelationshipOther(e.target.value)}
              placeholder={t("r.relationship.other.placeholder")}
              className="bg-background mt-1"
              disabled={loading}
              maxLength={120}
              aria-label={t("r.relationship.other.label")}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tone" className="text-sm font-medium">
            {t("r.tone.label")}
          </Label>
          <Select value={tone} onValueChange={setTone} disabled={loading}>
            <SelectTrigger id="tone" className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TONES.map((tn) => (
                <SelectItem key={tn.value} value={tn.value}>
                  {locale === "en" ? tn.en : tn.es}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="length" className="text-sm font-medium">
            {t("r.length.label")}
          </Label>
          <Select value={length} onValueChange={setLength} disabled={loading}>
            <SelectTrigger id="length" className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LENGTHS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {t(l.key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="format" className="text-sm font-medium">
            {t("r.format.label")}
          </Label>
          <Select value={format} onValueChange={setFormat} disabled={loading}>
            <SelectTrigger id="format" className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {t(f.key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal" className="text-sm font-medium">
          {t("r.goal.label")} <span className="text-muted-foreground font-normal">{t("common.optional")}</span>
        </Label>
        <Input
          id="goal"
          value={userGoal}
          onChange={(e) => setUserGoal(e.target.value)}
          placeholder={t("r.goal.placeholder")}
          className="bg-background"
          disabled={loading}
          maxLength={500}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="say" className="text-sm font-medium">
            {t("r.say.label")} <span className="text-muted-foreground font-normal">{t("common.optional")}</span>
          </Label>
          <Textarea
            id="say"
            value={sayPoints}
            onChange={(e) => setSayPoints(e.target.value)}
            placeholder={t("r.say.placeholder")}
            className="min-h-20 resize-y bg-background text-sm"
            disabled={loading}
            maxLength={1500}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avoid" className="text-sm font-medium">
            {t("r.avoid.label")} <span className="text-muted-foreground font-normal">{t("common.optional")}</span>
          </Label>
          <Textarea
            id="avoid"
            value={avoidPoints}
            onChange={(e) => setAvoidPoints(e.target.value)}
            placeholder={t("r.avoid.placeholder")}
            className="min-h-20 resize-y bg-background text-sm"
            disabled={loading}
            maxLength={1500}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="signature" className="text-sm font-medium">
            {t("r.signature.label")} <span className="text-muted-foreground font-normal">{t("common.optional")}</span>
          </Label>
          <Input
            id="signature"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder={t("r.signature.placeholder")}
            className="bg-background"
            disabled={loading}
            maxLength={64}
          />
          <p className="text-xs text-muted-foreground">{t("r.signature.help")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prev" className="text-sm font-medium">
            {t("r.history.label")}
          </Label>
          <Textarea
            id="prev"
            value={previousContext}
            onChange={(e) => setPreviousContext(e.target.value)}
            placeholder={t("r.history.placeholder")}
            className="min-h-20 resize-y bg-background text-sm"
            disabled={loading}
            maxLength={800}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <Button
          type="submit"
          disabled={loading || text.length > MAX_INPUT_CHARS}
          size="lg"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t("u.submit.loading")}
            </>
          ) : (
            <>
              <MessageSquareReply className="size-4" aria-hidden />
              {t("r.submit")}
            </>
          )}
        </Button>
        {(text || userGoal || hasResult) && !loading && (
          <Button type="button" variant="ghost" onClick={handleClear} className="gap-2">
            <RotateCcw className="size-4" aria-hidden />
            {t("r.clear")}
          </Button>
        )}
      </div>
    </form>
  )
}
