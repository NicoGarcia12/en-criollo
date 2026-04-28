"use client"

import {
  AlertTriangle,
  CheckCircle2,
  Languages,
  ListChecks,
  MessageSquareReply,
  Mic,
  Sparkles,
  HelpCircle,
  BookMarked,
} from "lucide-react"
import { CopyButton } from "./copy-button"
import { AlertBadge } from "./alert-badge"
import { useLocale } from "@/lib/i18n/locale-context"
import type { UnderstandOutput } from "./types"

export function UnderstandResult({ data }: { data: UnderstandOutput }) {
  const { t } = useLocale()

  return (
    <div className="space-y-4 pt-2 border-t border-border" aria-live="polite">
      {/* Problematic intent badge - top so user sees it first */}
      <AlertBadge intent={data.problematicIntent} />

      {/* Main summary */}
      <ResultCard
        icon={<Sparkles className="size-4" aria-hidden />}
        title={t("ur.summary")}
        accent="primary"
        action={<CopyButton text={data.summary} />}
      >
        <p className="text-sm leading-relaxed text-foreground">{data.summary}</p>
      </ResultCard>

      {/* Tone */}
      {data.toneAnalysis ? (
        <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3 flex gap-3 items-start">
          <span className="inline-flex items-center justify-center size-7 rounded-md bg-card text-muted-foreground shrink-0 mt-0.5 border border-border">
            <Mic className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-0.5">{t("ur.tone")}</p>
            <p className="text-sm leading-relaxed">{data.toneAnalysis}</p>
          </div>
        </div>
      ) : null}

      {/* Key points */}
      {data.keyPoints.length > 0 && (
        <ResultCard icon={<ListChecks className="size-4" aria-hidden />} title={t("ur.keypoints")}>
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

      {/* Actions */}
      <ResultCard
        icon={<CheckCircle2 className="size-4" aria-hidden />}
        title={t("ur.actions")}
        accent="accent"
      >
        {data.actions.length > 0 ? (
          <ol className="space-y-2">
            {data.actions.map((a, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                <span className="shrink-0 inline-flex items-center justify-center size-5 rounded-full bg-accent/30 text-accent-foreground text-xs font-semibold">
                  {i + 1}
                </span>
                <span>{a}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </ResultCard>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <ResultCard icon={<AlertTriangle className="size-4" aria-hidden />} title={t("ur.warnings")} accent="warning">
          <ul className="space-y-2">
            {data.warnings.map((w, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span className="mt-1.5 size-1.5 rounded-full bg-destructive shrink-0" aria-hidden />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </ResultCard>
      )}

      {/* Glossary */}
      {data.glossary && data.glossary.length > 0 && (
        <ResultCard icon={<BookMarked className="size-4" aria-hidden />} title={t("ur.glossary")}>
          <dl className="space-y-2">
            {data.glossary.map((g, i) => (
              <div key={i} className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 text-sm leading-relaxed">
                <dt className="font-mono font-semibold text-primary">{g.term}</dt>
                <dd className="text-foreground">{g.meaning}</dd>
              </div>
            ))}
          </dl>
        </ResultCard>
      )}

      {/* Questions to ask */}
      {data.questionsToAsk && data.questionsToAsk.length > 0 && (
        <ResultCard icon={<HelpCircle className="size-4" aria-hidden />} title={t("ur.questions")} accent="accent">
          <p className="text-xs text-muted-foreground mb-2">{t("ur.questions.help")}</p>
          <ul className="space-y-2">
            {data.questionsToAsk.map((q, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span className="mt-1.5 size-1.5 rounded-full bg-accent shrink-0" aria-hidden />
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </ResultCard>
      )}

      {/* Suggested reply */}
      {data.suggestedReply && (
        <ResultCard
          icon={<MessageSquareReply className="size-4" aria-hidden />}
          title={t("ur.suggested")}
          accent="primary"
          action={<CopyButton text={data.suggestedReply} />}
        >
          <blockquote className="text-sm leading-relaxed text-foreground border-l-2 border-primary pl-3 italic whitespace-pre-wrap">
            {data.suggestedReply}
          </blockquote>
        </ResultCard>
      )}

      {/* Bilingual alternate */}
      {data.needsBilingual && (data.alternateSummary || data.alternateSuggestedReply) ? (
        <div className="rounded-lg border border-accent/50 bg-accent/8 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-accent/30 bg-accent/15">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center size-7 rounded-md bg-accent text-accent-foreground">
                <Languages className="size-4" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-semibold tracking-tight">
                  {t("ur.alt.title")}
                  {data.alternateLanguageLabel ? (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      · {data.alternateLanguageLabel}
                    </span>
                  ) : null}
                </h3>
              </div>
            </div>
          </div>
          <div className="px-4 py-3.5 space-y-3">
            <p className="text-xs text-muted-foreground">{t("ur.alt.desc")}</p>
            {data.alternateSummary ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {t("ur.summary")}
                  </span>
                  <CopyButton text={data.alternateSummary} />
                </div>
                <p className="text-sm leading-relaxed">{data.alternateSummary}</p>
              </div>
            ) : null}
            {data.alternateSuggestedReply ? (
              <div className="space-y-1.5 pt-2 border-t border-accent/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {t("ur.suggested")}
                  </span>
                  <CopyButton text={data.alternateSuggestedReply} />
                </div>
                <blockquote className="text-sm leading-relaxed border-l-2 border-accent pl-3 italic whitespace-pre-wrap">
                  {data.alternateSuggestedReply}
                </blockquote>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
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
        ? "bg-accent/20 text-accent-foreground"
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
