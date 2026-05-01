"use client"

import Image from "next/image"
import { EnCriolloApp } from "@/components/encriollo/encriollo-app"
import { LocaleToggle } from "@/components/encriollo/locale-toggle"
import { useLocale } from "@/lib/i18n/locale-context"

export default function HomePage() {
  const { t } = useLocale()

  return (
    <main className="bg-background min-h-screen">
      <header className="border-border/60 bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-gaucho-head.jpg"
              alt="EnCriollo"
              width={56}
              height={56}
              className="rounded-lg"
              priority
            />
            <div className="leading-tight">
              <p className="font-semibold tracking-tight">EnCriollo</p>
              <p className="text-muted-foreground text-xs">{t("app.tagline")}</p>
            </div>
          </div>
          <LocaleToggle />
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 pt-10 pb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-pretty sm:text-4xl md:text-5xl">
          {t("app.title")} <span style={{ color: "var(--neon)" }}>{t("app.titleAccent")}</span>
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base leading-relaxed text-balance sm:text-lg">
          {t("app.subtitle")}
        </p>
      </section>

      <section id="app" className="mx-auto max-w-3xl px-4 pb-20">
        <EnCriolloApp />
      </section>

      <footer className="border-border/60 border-t">
        <div className="text-muted-foreground mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span style={{ color: "var(--neon)" }}>EnCriollo</span>
            {t("footer.disclaimer").startsWith("EnCriollo")
              ? " " + t("footer.disclaimer").slice(10)
              : " " + t("footer.disclaimer")}
          </p>
          <p>{t("footer.made")}</p>
        </div>
      </footer>
    </main>
  )
}
