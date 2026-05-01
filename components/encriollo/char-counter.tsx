"use client"

import { useLocale } from "@/lib/i18n/locale-context"

export const MAX_INPUT_CHARS = 8000

export function CharCounter({
  id,
  value = "",
  hint,
}: {
  id?: string
  value?: string
  hint?: string
}) {
  const { t, locale } = useLocale()
  const len = (value || "").length
  const over = len > MAX_INPUT_CHARS
  const near = !over && len > MAX_INPUT_CHARS * 0.85

  return (
    <p
      id={id}
      className={`flex items-center gap-2 text-xs ${
        over
          ? "text-destructive font-medium"
          : near
            ? "text-accent-foreground"
            : "text-muted-foreground"
      }`}
    >
      <span>
        {len.toLocaleString(locale)} / {MAX_INPUT_CHARS.toLocaleString(locale)} {t("common.chars")}
      </span>
      {over ? <span aria-hidden>·</span> : null}
      {over ? <span>{t("common.charLimit", { n: MAX_INPUT_CHARS })}</span> : null}
      {!over && hint ? (
        <>
          <span aria-hidden>·</span>
          <span>{hint}</span>
        </>
      ) : null}
    </p>
  )
}
