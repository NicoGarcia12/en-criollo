"use client"

import Image from "next/image"
import { EnCriolloApp } from "@/components/encriollo/encriollo-app"
import { useLocale } from "@/lib/i18n/locale-context"

export default function HomePage() {
  const { t } = useLocale()

  return (
    <main className="bg-background min-h-screen overflow-x-hidden">
      <header className="border-border/60 bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-en-criollo.png"
              alt="EnCriollo"
              width={56}
              height={56}
              className="h-auto w-auto rounded-lg"
              priority
            />
            <div className="leading-tight">
              <p className="font-semibold tracking-tight">EnCriollo</p>
              <p className="text-muted-foreground text-xs">{t("app.tagline")}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 pt-10 pb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-pretty sm:text-4xl md:text-5xl">
          {t("app.title")} <span style={{ color: "var(--neon)" }}>{t("app.titleAccent")}</span>
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base leading-relaxed text-balance sm:text-lg">
          {t("app.subtitle")}
        </p>
      </section>

      <section id="app" className="mx-auto max-w-4xl px-4 pb-20">
        <EnCriolloApp />
      </section>

      <footer className="border-border/60 border-t">
        <div className="text-muted-foreground mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 text-xs md:flex-col md:items-start lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
          <p>
            {/*
              Aplicamos el color neón SOLO al texto de marca del lado izquierdo,
              manteniendo el resto del disclaimer y el bloque derecho intactos.
            */}
            <span style={{ color: "var(--neon)" }}>En Criollo</span>{" "}
            {t("footer.disclaimer").replace(/^EnCriollo\s*/i, "")}
          </p>
          <p className="md:self-start lg:ml-auto lg:text-right">{t("footer.made")}</p>
        </div>
      </footer>
    </main>
  )
}
