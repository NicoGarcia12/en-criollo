import { Brain, Lightbulb, MessageCircle, MessageSquareReply, Sparkles, Zap } from "lucide-react"
import { CopyButton } from "./copy-button"
import type { ReplyOutput } from "./types"

export function ReplyResult({ data }: { data: ReplyOutput }) {
  return (
    <div className="space-y-4 pt-2 border-t border-border" aria-live="polite">
      {/* Interpretation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoBlock icon={<Brain className="size-4" aria-hidden />} title="Qué te están diciendo">
          {data.interpretation}
        </InfoBlock>
        <InfoBlock icon={<Lightbulb className="size-4" aria-hidden />} title="Intención probable">
          {data.probableIntent}
        </InfoBlock>
      </div>

      {/* Recommended reply - hero */}
      <ReplyCard
        icon={<Sparkles className="size-4" aria-hidden />}
        title="Respuesta recomendada"
        text={data.recommendedReply}
        primary
      />

      {/* Variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ReplyCard
          icon={<MessageCircle className="size-4" aria-hidden />}
          title="Versión corta"
          text={data.shortReply}
        />
        <ReplyCard
          icon={<Zap className="size-4" aria-hidden />}
          title="Versión más firme"
          text={data.firmReply}
        />
      </div>

      {/* Why it works */}
      <div className="rounded-lg border border-border bg-secondary/50 px-4 py-3 flex gap-3 items-start">
        <span className="inline-flex items-center justify-center size-7 rounded-md bg-accent/10 text-accent shrink-0">
          <MessageSquareReply className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Por qué conviene</p>
          <p className="text-sm leading-relaxed">{data.whyItWorks}</p>
        </div>
      </div>
    </div>
  )
}

function InfoBlock({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3.5">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="inline-flex items-center justify-center size-6 rounded-md bg-secondary text-secondary-foreground">
          {icon}
        </span>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  )
}

function ReplyCard({
  icon,
  title,
  text,
  primary = false,
}: {
  icon: React.ReactNode
  title: string
  text: string
  primary?: boolean
}) {
  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        primary ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div
        className={`flex items-center justify-between gap-3 px-4 py-2.5 border-b ${
          primary ? "border-primary/20 bg-primary/10" : "border-border bg-secondary/40"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center size-7 rounded-md ${
              primary ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {icon}
          </span>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        </div>
        <CopyButton text={text} />
      </div>
      <div className="px-4 py-3.5">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  )
}
