"use client"

import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"
import { useLocale } from "@/lib/i18n/locale-context"

export function LocaleToggle() {
  const { locale, setLocale, t } = useLocale()
  const next = locale === "es" ? "en" : "es"
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setLocale(next)}
      className="h-8 gap-1.5 text-xs font-semibold"
      aria-label={`${t("locale.label")}: ${locale.toUpperCase()} → ${next.toUpperCase()}`}
    >
      <Languages className="size-3.5" aria-hidden />
      <span aria-hidden>
        <span className={locale === "es" ? "text-foreground" : "text-muted-foreground"}>ES</span>
        <span className="text-muted-foreground mx-1">/</span>
        <span className={locale === "en" ? "text-foreground" : "text-muted-foreground"}>EN</span>
      </span>
    </Button>
  )
}
