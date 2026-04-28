import { Sparkles, MessageSquareReply, BookOpen } from "lucide-react"
import { EnCriolloApp } from "@/components/encriollo/encriollo-app"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Sparkles className="size-4" aria-hidden />
            </div>
            <div className="leading-tight">
              <p className="font-semibold tracking-tight">EnCriollo</p>
              <p className="text-xs text-muted-foreground">Entendé. Respondé. Sin vueltas.</p>
            </div>
          </div>
          <a
            href="#app"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Empezar
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pt-12 pb-8 text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-secondary text-secondary-foreground border border-border">
          <span className="size-1.5 rounded-full bg-primary" />
          Mini herramienta con IA
        </span>
        <h1 className="mt-4 text-pretty text-4xl md:text-5xl font-bold tracking-tight">
          Entendé lo importante. <span className="text-primary">Respondé mejor.</span>
        </h1>
        <p className="mt-4 text-balance text-lg text-muted-foreground leading-relaxed">
          Pegá un texto difícil y te decimos qué significa, qué importa y qué hacer. O pegá un mensaje incómodo y te
          ayudamos a responder claro, amable y sin quedar mal.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
          <div className="rounded-lg border border-border bg-card p-4 text-left">
            <BookOpen className="size-5 text-primary mb-2" aria-hidden />
            <p className="font-medium text-sm">Entender</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Textos legales, laborales, técnicos o confusos en palabras simples.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-left">
            <MessageSquareReply className="size-5 text-accent mb-2" aria-hidden />
            <p className="font-medium text-sm">Responder</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Mensajes incómodos con la respuesta justa: clara, amable y firme.
            </p>
          </div>
        </div>
      </section>

      {/* App */}
      <section id="app" className="mx-auto max-w-3xl px-4 pb-20">
        <EnCriolloApp />
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <p>EnCriollo no reemplaza asesoramiento legal, médico o financiero.</p>
          <p>Hecho con cariño y un poco de IA.</p>
        </div>
      </footer>
    </main>
  )
}
