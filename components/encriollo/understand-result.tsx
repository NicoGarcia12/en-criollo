import { AlertTriangle, CheckCircle2, ListChecks, MessageSquareReply, Sparkles } from "lucide-react"
import { CopyButton } from "./copy-button"
import type { UnderstandOutput } from "./types"

export function UnderstandResult({ data }: { data: UnderstandOutput }) {
  return (
    <div className="space-y-4 pt-2 border-t border-border" aria-live="polite">
      {/* En criollo */}
      <ResultCard
        icon={<Sparkles className="size-4" aria-hidden />}
        title="En criollo"
        accent="primary"
        action={<CopyButton text={data.plainExplanation} />}
      >
        <p className="text-sm leading-relaxed text-foreground">{data.plainExplanation}</p>
      </ResultCard>

      {/* Lo importante */}
      {data.keyPoints.length > 0 && (
        <ResultCard icon={<ListChecks className="size-4" aria-hidden />} title="Lo importante">
          <ul className="space-y-2">
            {data.keyPoints.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </ResultCard>
      )}

      {/* Qué hacer */}
      <ResultCard
        icon={<CheckCircle2 className="size-4" aria-hidden />}
        title="Qué tenés que hacer"
        accent="accent"
      >
        {data.actions.length > 0 ? (
          <ol className="space-y-2">
            {data.actions.map((a, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                <span className="shrink-0 inline-flex items-center justify-center size-5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                  {i + 1}
                </span>
                <span>{a}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">No hay acciones concretas que tengas que hacer.</p>
        )}
      </ResultCard>

      {/* Ojo con */}
      <ResultCard icon={<AlertTriangle className="size-4" aria-hidden />} title="Ojo con" accent="warning">
        {data.warnings.length > 0 ? (
          <ul className="space-y-2">
            {data.warnings.map((w, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span className="mt-1.5 size-1.5 rounded-full bg-destructive shrink-0" aria-hidden />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No veo alertas importantes en el texto.</p>
        )}
      </ResultCard>

      {/* Respuesta sugerida */}
      {data.suggestedReply && (
        <ResultCard
          icon={<MessageSquareReply className="size-4" aria-hidden />}
          title="Respuesta sugerida"
          accent="primary"
          action={<CopyButton text={data.suggestedReply} label="Copiar respuesta" />}
        >
          <blockquote className="text-sm leading-relaxed text-foreground border-l-2 border-primary pl-3 italic">
            {data.suggestedReply}
          </blockquote>
        </ResultCard>
      )}
    </div>
  )
}

function ResultCard({
  icon,
  title,
  accent,
  action,
  children,
}: {
  icon: React.ReactNode
  title: string
  accent?: "primary" | "accent" | "warning"
  action?: React.ReactNode
  children: React.ReactNode
}) {
  const accentClass =
    accent === "primary"
      ? "bg-primary/10 text-primary"
      : accent === "accent"
        ? "bg-accent/10 text-accent"
        : accent === "warning"
          ? "bg-destructive/10 text-destructive"
          : "bg-secondary text-secondary-foreground"

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-secondary/40">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center justify-center size-7 rounded-md ${accentClass}`}>{icon}</span>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        </div>
        {action}
      </div>
      <div className="px-4 py-3.5">{children}</div>
    </div>
  )
}
