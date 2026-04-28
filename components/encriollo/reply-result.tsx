"use client"

import { Brain, Languages, Lightbulb, ListChecks, MessageSquareReply, Sparkles } from "lucide-react"
import { CopyButton } from "./copy-button"
import { AlertBadge } from "./alert-badge"
import { useLocale } from "@/lib/i18n/locale-context"
import type { ReplyOutput } from "./types"

export function ReplyResult({ data }: { data: ReplyOutput }) {
  const { t } = useLocale()

  return (
    <div className="space-y-4 pt-2 border-t border-border" aria-live="polite">
      {/* Problematic intent on the received message */}
      <AlertBadge intent={data.problematicIntent} />

      {/* Interpretation row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoBlock icon={<Brain className="size-4" aria-hidden />} title={t("rr.interpretation")}>
          {data.interpretation}
        </InfoBlock>
        <InfoBlock icon={<Lightbulb className="size-4" aria-hidden />} title={t("rr.intent")}>
          {data.probableIntent}
        </InfoBlock>
      </div>

      {/* Draft bullets - the "what your reply will say" */}
      {data.draftBullets && data.draftBullets.length > 0 ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-secondary/40">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center size-7 rounded-md bg-accent/20 text-accent-foreground">
                <ListChecks className="size-4" aria-hidden />
              </span>
              <h3 className="text-sm font-semibold tracking-tight">{t("rr.draft")}</h3>
            </div>
          </div>
          <div className="px-4 py-3.5 space-y-2">
            <p className="text-xs text-muted-foreground">{t("rr.draft.help")}</p>
            <ul className="space-y-2">
              {data.draftBullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed">
                  <span className="mt-1.5 size-1.5 rounded-full bg-accent shrink-0" aria-hidden />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {/* Recommended reply */}
      <ReplyCard
        icon={<Sparkles className="size-4" aria-hidden />}
        title={t("rr.recommended")}
        text={data.reply}
        primary
      />

      {/* Why it works */}
      {data.whyItWorks ? (
        <div className="rounded-lg border border-border bg-secondary/50 px-4 py-3 flex gap-3 items-start">
          <span className="inline-flex items-center justify-center size-7 rounded-md bg-card text-muted-foreground shrink-0 mt-0.5 border border-border">
            <MessageSquareReply className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-0.5">{t("rr.why")}</p>
            <p className="text-sm leading-relaxed">{data.whyItWorks}</p>
          </div>
        </div>
      ) : null}

      {/* Bilingual alternate */}
      {data.needsBilingual && data.alternateReply ? (
        <div className="rounded-lg border border-accent/50 bg-accent/8 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-accent/30 bg-accent/15">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center size-7 rounded-md bg-accent text-accent-foreground">
                <Languages className="size-4" aria-hidden />
              </span>
              <h3 className="text-sm font-semibold tracking-tight">
                {t("rr.alt.title")}
                {data.alternateLanguageLabel ? (
                  <span className="text-muted-foreground font-normal"> · {data.alternateLanguageLabel}</span>
                ) : null}
              </h3>
            </div>
            <CopyButton text={data.alternateReply} />
          </div>
          <div className="px-4 py-3.5 space-y-2">
            <p className="text-xs text-muted-foreground">{t("rr.alt.desc")}</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.alternateReply}</p>
            {data.alternateDraftBullets && data.alternateDraftBullets.length > 0 ? (
              <ul className="pt-2 mt-2 border-t border-accent/30 space-y-1.5">
                {data.alternateDraftBullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                    <span className="mt-1.5 size-1 rounded-full bg-accent shrink-0" aria-hidden />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
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
