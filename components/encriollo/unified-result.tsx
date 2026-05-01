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

  if ("error" in data && data.error) {
    return (
      <div className="mt-6 p-4 rounded-xl border-2 border-destructive/50 bg-destructive/10">
        <p className="text-sm text-destructive">{data.error}</p>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Alerta si hay riesgo */}
      {data.alert && (
        <div className="p-4 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 flex gap-3">
          <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="font-semibold text-amber-500 text-sm">{t("result.alert")}</p>
            <p className="text-sm mt-1">{data.alert}</p>
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
              <li key={i} className="text-sm flex gap-2">
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
              <li key={i} className="text-sm flex gap-2">
                <span className="font-bold" style={{ color: "var(--neon)" }}>{i + 1}.</span>
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
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
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
                <dt className="font-semibold text-primary inline">{item.term}:</dt>
                <dd className="inline ml-1">{item.meaning}</dd>
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
    <div className={`p-4 rounded-xl border-2 ${borderColor} bg-card`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
        </div>
        {copyText && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs gap-1"
          >
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
