"use client"

import { AlertTriangle, Shield, ShieldAlert, ShieldX } from "lucide-react"
import { useLocale } from "@/lib/i18n/locale-context"
import type { ProblematicIntent } from "./types"

export function AlertBadge({ intent }: { intent: ProblematicIntent }) {
  const { t } = useLocale()

  if (!intent || !intent.detected || intent.type === "normal") {
    return null
  }

  const cfg = (() => {
    switch (intent.type) {
      case "estafa":
        return {
          icon: <ShieldX className="size-4" aria-hidden />,
          label: t("prob.scam"),
          tone: "border-destructive/40 bg-destructive/8 text-destructive",
          dot: "bg-destructive",
        }
      case "agresivo":
        return {
          icon: <ShieldAlert className="size-4" aria-hidden />,
          label: t("prob.aggressive"),
          tone: "border-destructive/40 bg-destructive/8 text-destructive",
          dot: "bg-destructive",
        }
      case "manipulacion":
        return {
          icon: <Shield className="size-4" aria-hidden />,
          label: t("prob.manipulation"),
          tone: "border-accent/60 bg-accent/15 text-accent-foreground",
          dot: "bg-accent",
        }
      default:
        return {
          icon: <AlertTriangle className="size-4" aria-hidden />,
          label: t("prob.normal"),
          tone: "border-border bg-secondary text-secondary-foreground",
          dot: "bg-muted-foreground",
        }
    }
  })()

  return (
    <div
      role="alert"
      className={`rounded-lg border ${cfg.tone} px-4 py-3 flex gap-3 items-start`}
    >
      <span className="inline-flex items-center justify-center size-7 rounded-md bg-background/60 shrink-0 mt-0.5">
        {cfg.icon}
      </span>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className={`size-1.5 rounded-full ${cfg.dot}`} aria-hidden />
          <p className="text-xs font-bold uppercase tracking-wide">
            {t("ur.problematic.title")} · {cfg.label}
          </p>
        </div>
        <p className="text-sm leading-relaxed">{intent.explanation}</p>
        {intent.suggestion ? (
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">{t("ur.problematic.suggestion")}:</span> {intent.suggestion}
          </p>
        ) : null}
      </div>
    </div>
  )
}
