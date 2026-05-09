"use client"

import { AlertTriangle, Copy, Check, FileText, ListChecks, MessageSquare } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/i18n/locale-context"
import type { UnifiedOutput } from "./types"

interface UnifiedResultProps {
  data: UnifiedOutput
  mode: "understand" | "reply"
}

export function UnifiedResult({ data, mode }: UnifiedResultProps) {
  const { t } = useLocale()
  const [isRateLimitVisible, setIsRateLimitVisible] = useState(true)

  if ("error" in data && data.error) {
    if (data.errorCode === "rate_limit") {
      if (!isRateLimitVisible) return null

      return (
        <div className="border-destructive/50 bg-destructive/10 mt-6 rounded-xl border-2 p-4">
          {/* Sin título: por requerimiento de negocio, mostramos solo cuerpo + CTA */}
          <p className="text-destructive/90 text-sm break-words whitespace-pre-wrap">
            {data.error}
          </p>
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-destructive/40 text-destructive hover:bg-destructive/15"
              onClick={() => setIsRateLimitVisible(false)}
            >
              {t("common.close")}
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="border-destructive/50 bg-destructive/10 mt-6 rounded-xl border-2 p-4">
        <p className="text-destructive text-sm font-semibold">Error</p>
        <p className="text-destructive/90 mt-1 text-sm break-words whitespace-pre-wrap">
          {data.error}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Alerta si hay riesgo */}
      {data.alert && (
        <div className="flex gap-3 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-amber-500">{t("result.alert")}</p>
            <p className="mt-1 text-sm">{data.alert}</p>
          </div>
        </div>
      )}

      {/* Resumen principal */}
      {data.summary && (
        <ResultCard
          icon={<FileText className="size-4" />}
          title={t("result.summary")}
          copyText={data.summary}
        >
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </ResultCard>
      )}

      {/* Puntos clave (solo modo entender) */}
      {mode === "understand" && data.keyPoints && data.keyPoints.length > 0 && (
        <ResultCard icon={<ListChecks className="size-4" />} title={t("result.keypoints")}>
          <ul className="space-y-1.5">
            {data.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-primary font-bold">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </ResultCard>
      )}

      {/* Acciones (solo modo entender) */}
      {mode === "understand" && data.actions && data.actions.length > 0 && (
        <ResultCard
          icon={<ListChecks className="size-4" />}
          title={t("result.actions")}
          accent="primary"
        >
          <ul className="space-y-1.5">
            {data.actions.map((action, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="font-bold" style={{ color: "var(--neon)" }}>
                  {i + 1}.
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </ResultCard>
      )}

      {/* Respuesta lista (modo responder) */}
      {mode === "reply" && data.reply && (
        <ResultCard
          icon={<MessageSquare className="size-4" />}
          title={t("result.reply")}
          copyText={data.reply}
          accent="primary"
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.reply}</p>
          {data.replyReason && (
            <p className="text-muted-foreground border-border mt-3 border-t pt-3 text-xs">
              {data.replyReason}
            </p>
          )}
        </ResultCard>
      )}

      {/* Glosario (solo si hay términos) */}
      {data.glossary && data.glossary.length > 0 && (
        <ResultCard icon={<FileText className="size-4" />} title={t("result.glossary")}>
          <dl className="space-y-2">
            {data.glossary.map((item, i) => (
              <div key={i} className="text-sm">
                <dt className="text-primary inline font-semibold">{item.term}:</dt>
                <dd className="ml-1 inline">{item.meaning}</dd>
              </div>
            ))}
          </dl>
        </ResultCard>
      )}
    </div>
  )
}

// Componente interno para cards de resultado
function ResultCard({
  icon,
  title,
  children,
  copyText,
  accent,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  copyText?: string
  accent?: "primary" | "warning"
}) {
  const { t } = useLocale()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!copyText) return
    await navigator.clipboard.writeText(copyText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const borderColor =
    accent === "primary"
      ? "border-primary/40"
      : accent === "warning"
        ? "border-amber-500/40"
        : "border-border"

  return (
    <div className={`rounded-xl border-2 p-4 ${borderColor} bg-card`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-muted-foreground flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold tracking-wide uppercase">{title}</span>
        </div>
        {copyText && (
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 gap-1 px-2 text-xs">
            {copied ? (
              <>
                <Check className="size-3" aria-hidden />
                {t("copied")}
              </>
            ) : (
              <>
                <Copy className="size-3" aria-hidden />
                {t("copy")}
              </>
            )}
          </Button>
        )}
      </div>
      {children}
    </div>
  )
}
