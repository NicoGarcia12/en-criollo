"use client"

import { BrainCircuit } from "lucide-react"
import { EnCriolloApp } from "@/components/encriollo/encriollo-app"
import { LocaleToggle } from "@/components/encriollo/locale-toggle"
import { useLocale } from "@/lib/i18n/locale-context"

export default function HomePage() {
  const { t } = useLocale()

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="size-10 rounded-lg bg-secondary border-2 flex items-center justify-center"
              style={{
                borderColor: "color-mix(in oklch, var(--neon) 40%, var(--border))",
                boxShadow: "0 0 16px color-mix(in oklch, var(--neon) 25%, transparent)",
              }}
            >
              <BrainCircuit className="size-5" aria-hidden style={{ color: "var(--neon)" }} />
            </div>
            <div className="leading-tight">
              <p className="font-semibold tracking-tight">EnCriollo</p>
              <p className="text-xs text-muted-foreground">{t("app.tagline")}</p>
            </div>
          </div>
          <LocaleToggle />
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 pt-10 pb-6 text-center">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-secondary text-secondary-foreground border border-border"
        >
          <span
            className="size-1.5 rounded-full"
            style={{ background: "var(--neon)", boxShadow: "0 0 6px var(--neon)" }}
          />
          {t("app.badge")}
        </span>
        <h1 className="mt-4 text-pretty text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
          {t("app.title")} <span style={{ color: "var(--neon)" }}>{t("app.titleAccent")}</span>
        </h1>
        <p className="mt-4 text-balance text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
          {t("app.subtitle")}
        </p>
      </section>

      <section id="app" className="mx-auto max-w-3xl px-4 pb-20">
        <EnCriolloApp />
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-4 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <p>{t("footer.disclaimer")}</p>
          <p>{t("footer.made")}</p>
        </div>
      </footer>
    </main>
  )
}
